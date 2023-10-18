require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const Flight = require("../models/Flight");
const Airline = require("../models/Airline");
const Airport = require("../models/Airport");
const FlightsBackup = require("../models/FlightsBackup");

let AirLabsInstance;

class AirLabs {
    #name;
    #airlabsSnapshot = {};
    #flightsList = [];
    #cycleCount = 1;
    #startDateTime;
    //This makes sure there is only one instance of this class at any time
    //ENV VARIABLES:
    #seconds = 30;
    #max_cycles = 0;
    #db_backups = true;
    #airlabs_collect_data = true;
    #flight_timeout = 600;
    constructor() {
        if (AirLabsInstance) {
            throw new Error("New instance cannot be created!!");
        }
        AirLabsInstance = this;

        if (process.env.TIME_BETWEEN_CYCLES) {
            this.#seconds = Number(process.env.TIME_BETWEEN_CYCLES);
        }
        if (process.env.MAX_AIRLABS_CYCLES) {
            this.#max_cycles = Number(process.env.MAX_AIRLABS_CYCLES);
        }
        if (process.env.DB_BACKUPS) {
            this.#db_backups = Boolean(process.env.DB_BACKUPS);
        }
        if (process.env.AIRLABS_COLLECT_DATA) {
            this.#airlabs_collect_data = Boolean(
                process.env.AIRLABS_COLLECT_DATA
            );
        }
        if (process.env.FLIGHT_TIMETOUT) {
            this.#flight_timeout = Number(process.env.FLIGHT_TIMETOUT);
        }
    }

    //Entry point function of this class. It will call the updateAllData function every XXX seconds.
    async dataCollector() {
        //Getting the flights from the DataBase
        //this.#flightsList = await this.getFlightListFromDB(true);

        this.#startDateTime = Date.now();

        //if airlabs_collect_data is set to true then we collect data from AirLabs, if not then we just load it from the DB
        if (this.#airlabs_collect_data === true) {
            //Running the cycle for the first time due to the behavior of setInterval
            await this.dataCollectionCycle();

            //Running the cycle only if max_cycles is not 1, if it was set to one then we already ran the cycle one time
            if (this.#max_cycles !== 1 && this.#max_cycles >= 0) {
                const interval = await setInterval(
                    async function () {
                        await this.dataCollectionCycle();
                        this.#cycleCount++;
                        if (
                            this.#max_cycles > 0 &&
                            this.#cycleCount >= this.#max_cycles
                        ) {
                            console.log(
                                "Reached the maximum number of cycles. Stopping data collection."
                            );
                            clearInterval(interval);
                        }
                    }.bind(this),
                    this.#seconds * 1000
                );
            }
        } else {
            await this.getFlightListFromDB();
            console.log(
                "AirLabs data collection is OFF, loading offline data."
            );
        }
    }

    //HAVING MEMORY LEAK PROBLEMS WITH THIS ONE, LETS MAKE IS SIMPLER
    //Main function that gets flights from the DataBase and Airlabs and updates as needed
    //DEPRECATED
    // async updateAllData() {
    //     let DBFlights = this.#flightsList;
    //     //Collecting the latest flights from AirLabs
    //     let ALFlights = await this.getFlightListFromAirLabs(true);
    //     //Checking that we received something from active fligths
    //     if (ALFlights && ALFlights.length != 0) {
    //         let newFlightsList = []; // Any new flight that AirLabs added since the last update
    //         let updateFlightsList = []; // Fligths that we already had and need to be updated with AirLabs data
    //         let latestUpdateTime = ALFlights[0].updated; // The latest update time
    //         // First we need to clean the DataBase and mark old flights as inactive
    //         await this.cleanOldFlightsDB(latestUpdateTime, 6000, true);

    //         // Loop through flights obtained from AirLabs
    //         for (const airlabsFlight of ALFlights) {
    //             // See if the airlabsFlight exist in the database
    //             let dbFlight = DBFlights.find((flight) => {
    //                 return airlabsFlight.hex === flight.hex;
    //             });
    //             //If it exists then we need to update some properties then add this flight to the updateFligths array to be pushed to the DB later
    //             if (dbFlight) {
    //                 dbFlight.lat = airlabsFlight.lat;
    //                 dbFlight.lng = airlabsFlight.lng;
    //                 dbFlight.dir = airlabsFlight.dir;
    //                 dbFlight.updated = airlabsFlight.updated;
    //                 dbFlight.positionHistory.push({
    //                     lat: airlabsFlight.lat,
    //                     lng: airlabsFlight.lng,
    //                     alt: airlabsFlight.alt,
    //                     dir: airlabsFlight.dir,
    //                     updated: airlabsFlight.updated,
    //                 });
    //                 updateFlightsList.push(dbFlight);
    //             }
    //             //If it doesn't exist then it is a new flight, we set some properties and push it to the newFlights array
    //             else {
    //                 airlabsFlight.isActive = true;
    //                 airlabsFlight.positionHistory = {
    //                     lat: airlabsFlight.lat,
    //                     lng: airlabsFlight.lng,
    //                     alt: airlabsFlight.alt,
    //                     dir: airlabsFlight.dir,
    //                     updated: airlabsFlight.updated,
    //                 };
    //                 newFlightsList.push(airlabsFlight);
    //             }
    //         }
    //         // Add the new flights to the database
    //         this.addFlightsToDB(newFlightsList, true);
    //         // Update flights in the database
    //         this.updatesFlightsDB(updateFlightsList, true);
    //         //Finally we update the flightsList with the flights from the DataBase

    //         //this.#flightsList = null;
    //         newFlightsList = null;
    //         updateFlightsList = null;
    //         DBFlights = null;
    //         ALFlights = null;
    //         this.#flightsList = await this.getFlightListFromDB(true);
    //     }
    // }
    async dataCollectionCycle() {
        await this.updateFromAirLabs();

        if (this.#db_backups === true) {
            await this.saveFlightBackupToDB();
        }
    }

    async updateFromAirLabs() {
        let ALFlights = await this.getFlightListFromAirLabs(true);
        if (ALFlights && ALFlights.length != 0) {
            this.printLog("Storing data.", true);

            const latestUpdateTime = ALFlights[0].updated;
            let newFlightsCount = 0;
            let updatedFlightsCount = 0;
            let deletedFlightCount = 0;
            for (const airlabsFlight of ALFlights) {
                //ADD
                if (!this.#airlabsSnapshot[airlabsFlight.hex]) {
                    this.#airlabsSnapshot[airlabsFlight.hex] = airlabsFlight;
                    this.#airlabsSnapshot[airlabsFlight.hex].positionHistory = [
                        {
                            lat: airlabsFlight.lat,
                            lng: airlabsFlight.lng,
                            alt: airlabsFlight.alt,
                            dir: airlabsFlight.dir,
                            updated: airlabsFlight.updated,
                        },
                    ];
                    newFlightsCount++;
                } else {
                    //UPDATE
                    let flight = this.#airlabsSnapshot[airlabsFlight.hex];
                    flight.lat = airlabsFlight.lat;
                    flight.lng = airlabsFlight.lng;
                    flight.updated = airlabsFlight.updated;
                    flight.positionHistory.push({
                        lat: airlabsFlight.lat,
                        lng: airlabsFlight.lng,
                        alt: airlabsFlight.alt,
                        dir: airlabsFlight.dir,
                        updated: airlabsFlight.updated,
                    });
                    updatedFlightsCount++;
                }
            }

            //Deleting the flights that are not been updated for the last .env/FLIGHT_TIMETOUT seconds
            const flightsArray = Object.values(this.#airlabsSnapshot);
            flightsArray
                .filter(
                    (elem) =>
                        elem?.updated < latestUpdateTime - this.#flight_timeout
                )
                .forEach((f) => {
                    //this.#airlabsSnapshot[f.hex] = undefined;
                    delete this.#airlabsSnapshot[f.hex];
                    deletedFlightCount++;
                });
            //Printing information in the console
            this.printLog("Finished Storing data.", true);
            this.printLog(
                `A total of ${newFlightsCount} flights were added`,
                true
            );
            this.printLog(
                `A total of ${updatedFlightsCount} flights were updated`,
                true
            );
            this.printLog(
                `A total of ${deletedFlightCount} flights were deleted`,
                true
            );
            this.printLog(
                `A total of ${flightsArray.length} are stored in the system`,
                true
            );
            this.printLog(`------------------------------------------`, true);
        }
    }
    //TRYING TO MAKE IT IGNORE THE DATABASE

    ///////////////////////////
    async deleteDB() {
        this.printLog(`Starting deleting the entire DB.`, true);
        await Flight.deleteMany({});
        this.printLog(`Finished deleting the entire DB.`, true);
    }

    async saveFlightBackupToDB() {
        let flightsBackup = {};
        flightsBackup.flights = this.AirlabsFlightsArray;
        flightsBackup.startedDateTime = this.#startDateTime;
        flightsBackup.latestUpdateDateTime = Date.now();

        try {
            this.printLog(`Saving flights to the database.`, true);
            const newFlights = await FlightsBackup.findOneAndUpdate(
                { startedDateTime: this.#startDateTime },
                { $set: flightsBackup },
                { upsert: true, new: true }
            );
            this.printLog(`Finished saving flights to the database.`, true);
        } catch (error) {
            this.printLog(
                `An error ocurred while trying to save flights to the database: ${error}`,
                true
            );
        }
    }

    //It adds flights to the database
    async addFlightsToDB(flights, verbose) {
        this.printLog(
            `Adding new (${flights?.length}) flights to the database.`,
            verbose
        );
        Flight.insertMany(flights);
        this.printLog(`Flights added to the database.`, verbose);
    }

    async getFlightsFromDB() {
        const flights_backup = FlightsBackup.findOne({}).sort({
            startedDateTime: -1,
        });

        this.#startDateTime = flights_backup.startedDateTime;
        this.#airlabsSnapshot = {};

        flights_backup.forEach((Flight) => {
            this.#airlabsSnapshot[flight.hex] = flight;
        });
    }

    ////////////////////////

    //deprecated
    setSnapshot(airlabsData) {
        const tempSnapshot = airlabsData.map(function (flight) {
            return {
                hex: flight.hex,
                reg_number: flight.reg_number,
                lat: flight.lat,
                lng: flight.lng,
                dir: flight.dir,
                flight_icao: flight.flight_icao,
                flight_iata: flight.flight_iata,
            };
        });

        this.#airlabsSnapshot = tempSnapshot;
    }

    //Given a flight hex, will query AirLabs API and return an specific flight
    //https://airlabs.co/docs/flight
    async getFlightInfoFromAirLabs(hex, iata_code, icao_code) {
        const flight = this.#airlabsSnapshot[hex];

        if (iata_code === undefined) {
            iata_code = "";
        }
        if (icao_code === undefined) {
            icao_code = "";
        }

        if (flight !== undefined) {
            const airlabsResponse = await axios(
                `https://airlabs.co/api/v9/flight?api_key=${process.env.AIRLABS_APIKEY}&flight_icao=${flight.flight_icao}&flight_iata=${flight.flight_iata}`
            );
            airlabsResponse.data.response.positionHistory =
                flight.positionHistory;
            return airlabsResponse.data.response;
        } else if (iata_code || icao_code) {
            console.log(icao_code);
            const airlabsResponse = await axios(
                `https://airlabs.co/api/v9/flight?api_key=${process.env.AIRLABS_APIKEY}&flight_icao=${icao_code}&flight_iata=${iata_code}`
            );
            // airlabsResponse.data.response.positionHistory =
            //     flight.positionHistory;
            console.log(airlabsResponse.data);
            return airlabsResponse.data.response;
        } else {
            throw new Error(`Flight hex: ${hex} doesn't exist.`);
        }
        return undefined;
    }

    //returns all the active flights from the database.
    async getFlightListFromDB(verbose) {
        this.printLog("Obtaining flights from the Database.", verbose);
        const activeFlights = await Flight.find({ isActive: true }); // add this in case we want to filter the return .select("hex reg_number dir lat lng flight_iata flight_icao")
        this.printLog(
            `A total of ${activeFlights.length} flights were obtained.`,
            verbose
        );
        return activeFlights;
    }

    //It gets a flight list from AirLabs.
    //https://airlabs.co/docs/flights
    async getFlightListFromAirLabs(verbose) {
        const _fields =
            "_fields=hex,lat,lng,alt,dir,flight_icao,flight_iata,updated";
        try {
            this.printLog("Obtaining flights from AirLabs.", verbose);
            const airlabsResponse = await axios(
                `https://airlabs.co/api/v9/flights?api_key=${process.env.AIRLABS_APIKEY}&${_fields}`
            );
            const result = airlabsResponse.data.response;
            this.printLog(
                `A total of ${result.length} were obtained.`,
                verbose
            );
            return result;
        } catch (error) {
            console.log(
                `An error ocurred trying to get flight data from airlabs: ${error}`
            );
            return undefined;
        }
    }

    //It updates flights in the database
    async updateFlightsDB(flights, verbose) {
        this.printLog(
            `Updating (${flights?.length}) flights in the database.`,
            verbose
        );
        Flight.bulkSave(flights);
        this.printLog(`Flights updated in the database.`, verbose);
    }

    //Cleans up flights that hasn't been updated for a while
    async cleanDB(lastUpdatedTime, time, verbose) {
        this.printLog(`Finding inactive flights.`, verbose);

        const timer = lastUpdatedTime - time;

        let inactive = await Flight.find({
            isActive: true,
            updated: { $lt: timer }, //if updated is older than (last updated time minus time) then we updated it
        });
        this.printLog(
            `Found ${inactive?.length} flights that are inactive, updating them.`
        );
        for (const flight of inactive) {
            flight.isActive = false;
        }

        await Flight.bulkSave(inactive);
        this.printLog(
            `A tolta of ${inactive?.length} flights were updated to inactive.`,
            verbose
        );
    }

    // It just prints a log in the console with the current time, moved this here to clean up the main functions
    printLog(message, verbose = false) {
        if (verbose) {
            console.log(`${new Date(Date.now()).toUTCString()}: ${message}`);
        }
    }

    //PROPERTIES
    get name() {
        return this.#name;
    }
    set name(val) {
        this.#name = val;
    }
    get Flights() {
        return this.#flightsList;
    }
    get AirlabsFlightsArray() {
        return Object.values(this.#airlabsSnapshot);
    }
}

//Calling the class constructor which will initialize our only instance of AirLabs
Object.freeze(new AirLabs());
//Exporting our one and only instance
module.exports = AirLabsInstance;
