const mongoose = require("mongoose");

const Flight = require("../models/Flight");

const mongoDB_URL = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.ln73gxc.mongodb.net/?retryWrites=true&w=majority`;
let AirlineDefault = require("../default_data/airlines");
let AirportDefault = require("../default_data/airports");
const Airline = require("../models/Airline");
const Airport = require("../models/Airport");

let DBInstance;

class DB {
    #connected = false;
    constructor() {
        if (DBInstance) {
            throw new Error("New instance of DB cannot be created!!");
        }
        DBInstance = this;
    }

    async connect() {
        if (!this.#connected) {
            try {
                console.log(`Connecting to MongoDB database...`);
                //await mongoose.connect(mongoDB_URL);
                await mongoose.connect(
                    `mongodb://${process.env.MONGODB_LOCAL_ADDRESS}:27017/flighttrack`
                );
                console.log("connected to MongoDB with mongoose.");

                //Checking DB health, making sure the Airport and Airline collections exist, if not then populate them
                if (process.env.DB_HEALTH_CHECK === true) {
                    await this.checkDBHealth();
                }
                this.#connected = true;
            } catch (error) {
                console.log(error);
            }
        }
    }

    async checkDBHealth() {
        console.log(`Checking DB's health.....`);
        console.log(`Veryfing Airlines Collection....`);
        if ((await Airline.find()).length !== AirlineDefault.length) {
            console.log(`Airlines Collection is healthy....`);
        } else {
            console.log(
                `Airlines Collection isn't healthy, pushing default Airlines to the database....`
            );
            await Airline.insertMany(AirlineDefault);
            if ((await Airline.find()).length !== AirlineDefault.length) {
                throw new Error(
                    "An error while trying to setup the Airlines collection"
                );
            }
            console.log(
                `Default Airlines Collection pushed to the database....`
            );
        }

        console.log(`Veryfing Airport Collection....`);
        if ((await Airport.find()).length !== AirportDefault.length) {
            console.log(`Airports Collection is healthy....`);
        } else {
            console.log(
                `Airports Collection isn't healthy, pushing default Airports to the database....`
            );
            await Airport.insertMany(AirportDefault);
            if ((await Airport.find()).length !== AirportDefault.length) {
                throw new Error(
                    "An error while trying to setup the Airports collection"
                );
            }
            console.log(
                `Default Airports Collection pushed to the database....`
            );
        }

        console.log(`Finished DB's health checks.....`);
    }
}

//Calling the class constructor which will initialize our only instance of AirLabs
Object.freeze(new DB());
//Exporting our one and only instance
module.exports = DBInstance;

// module.exports = {
//     connect: async () => {
//         try {
//             console.log(`Connecting to MongoDB database...`);
//             //await mongoose.connect(mongoDB_URL);
//             await mongoose.connect(
//                 `mongodb://${process.env.MONGODB_LOCAL_ADDRESS}:27017/flighttrack`
//             );
//             console.log("connected to MongoDB with mongoose.");

//             //Checking DB health, making sure the Airport and Airline collections exist, if not then populate them
//         } catch (error) {
//             console.log(error);
//         }
//     },
//     getFlights: async () => {
//         return await Flight.find();
//     },
// };
