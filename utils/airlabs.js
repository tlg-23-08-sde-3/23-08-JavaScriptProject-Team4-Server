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

        //Obtaining the ENV values and storing them in local variables.
        if (process.env.TIME_BETWEEN_CYCLES) {
            this.#seconds = Number(process.env.TIME_BETWEEN_CYCLES);
        }
        if (process.env.MAX_AIRLABS_CYCLES) {
            this.#max_cycles = Number(process.env.MAX_AIRLABS_CYCLES);
        }
        if (process.env.DB_BACKUPS) {
            this.#db_backups = process.env.DB_BACKUPS === "true";
        }
        if (process.env.AIRLABS_COLLECT_DATA) {
            this.#airlabs_collect_data =
                process.env.AIRLABS_COLLECT_DATA === "true";
        }
        if (process.env.FLIGHT_TIMETOUT) {
            this.#flight_timeout = Number(process.env.FLIGHT_TIMETOUT);
        }
    }

    //Entry point function of this class. It will call the updateAllData function every XXX seconds.
    async dataCollector() {
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

    //This is what will happen on every cycle
    async dataCollectionCycle() {
        //First we get the data from Airlabs
        await this.updateFromAirLabs();

        //Then we store it in the database
        if (this.#db_backups === true) {
            await this.saveFlightBackupToDB();
        }
    }

    //Getting data from AirLabs
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
                    flight.dir = airlabsFlight.dir;
                    flight.alt = airlabsFlight.alt;
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

    //Saving data into the database
    async saveFlightBackupToDB() {
        let flightsBackup = {};
        flightsBackup.flights = this.AirlabsFlightsArray;
        flightsBackup.startedDateTime = this.#startDateTime;
        flightsBackup.latestUpdateDateTime = Date.now();

        try {
            this.printLog(`Saving flights to the database.`, true);
            // await FlightsBackup.findOneAndUpdate(
            //     { startedDateTime: this.#startDateTime },
            //     { $set: flightsBackup },
            //     { upsert: true, new: true }
            // );

            this.printLog(`Finding the one`, true);
            let dbFlightDB = FlightsBackup.findOne({
                startedDateTime: this.#startDateTime,
            });

            if (dbFlightDB) {
                this.printLog(`Found one, deleting it`, true);
                await FlightsBackup.findOneAndDelete({
                    startedDateTime: flightsBackup.startedDateTime,
                });
            }
            this.printLog(`Inserting new one`, true);
            await FlightsBackup.create(flightsBackup);
            //await FlightsBackup.insertMany(flightsBackup);
            this.printLog(`Finished inserting new one`, true);

            this.printLog(`Finished saving flights to the database.`, true);
        } catch (error) {
            this.printLog(
                `An error ocurred while trying to save flights to the database: ${error}`,
                true
            );
        }
    }

    //Obtains flights from the database
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
            if (flight.positionHistory) {
                airlabsResponse.data.response.positionHistory =
                    flight.positionHistory;
            } else {
                airlabsResponse.data.response.positionHistory = [];
            }

            return airlabsResponse.data.response;
        } else if (iata_code || icao_code) {
            console.log(icao_code);
            const airlabsResponse = await axios(
                `https://airlabs.co/api/v9/flight?api_key=${process.env.AIRLABS_APIKEY}&flight_icao=${icao_code}&flight_iata=${iata_code}`
            );
            console.log(airlabsResponse.data);
            return airlabsResponse.data.response;
        } else {
            throw new Error(`Flight hex: ${hex} doesn't exist.`);
        }
        return undefined;
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
    get AirlabsFlightsArray() {
        return Object.values(this.#airlabsSnapshot);
    }

    get Backup() {
        let flightsBackup = {};
        flightsBackup.flights = this.AirlabsFlightsArray;
        flightsBackup.startedDateTime = this.#startDateTime;
        flightsBackup.latestUpdateDateTime = Date.now();

        return flightsBackup;
    }

    get StartedDateTime() {
        return this.#startDateTime;
    }
}

//Calling the class constructor which will initialize our only instance of AirLabs
Object.freeze(new AirLabs());
//Exporting our one and only instance
module.exports = AirLabsInstance;
