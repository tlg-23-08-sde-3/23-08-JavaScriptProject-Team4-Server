require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");

const Flight = require("./models/Flight");

//Importing our routers
const { Router } = require("./routes/index");
const { Router: AirplaneRouter } = require("./routes/airplane");
const { Router: AirportRouter } = require("./routes/airport");
const { Router: AirlineRouter } = require("./routes/airline");
const { Router: TestRouter } = require("./routes/test");
const { Router: FlightRouter } = require("./routes/flight");
const { Router: FlightsRouter } = require("./routes/flights");

const AirLabs = require("./utils/airlabs");

//Import our MongoDB connector
//const { connect } = require("./utils/db");
const MongoDB = require("./utils/db");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Use our routers
app.use(Router);
app.use(AirplaneRouter);
app.use(AirportRouter);
app.use(AirlineRouter);
app.use(TestRouter);
app.use(FlightRouter);
app.use(FlightsRouter);

app.get("/api/check", async (req, res) => {
    res.status(200).json({ message: "OK" });
});

const PORT = process.env.PORT || 8080;

const a = { a: { hex: 1 }, b: { hex: 2 }, c: { hex: 3 } };

// a["d"] = { hex: 4 };
// b = a["d"];
// b.r = 69;

// for (const t in a) {
//     console.log(a[t]);
// }

//MongoDB.connect();

app.listen(PORT, async function () {
    console.log(`Listening on port: ${PORT}`);

    await MongoDB.connect();

    await AirLabs.dataCollector();
});

//AirLabs.dataCollector();

//TEST
// async function continuousFunction() {
//     // Perform asynchronous tasks here
//     // For this example, we'll simulate an asynchronous task with a timeout
//     setTimeout(async () => {
//         console.log("Continuous function executed");
//         let a;
//         for (let i = 0; i < 9999999999; i++) {
//             a = i;
//         }
//         console.log("Finished");
//     }, 1000);
// }

// const interval = setInterval(continuousFunction, 1000);

//TODO DELETE THIS, JUST TO SHOW HOW MONGO WOULD HANDLE MODIFICATIONS AND UPDATES
async function testingDB() {
    console.log(`${new Date(Date.now()).toUTCString()}: ${"deleting"}`);
    await Flight.deleteMany({});
    console.log(
        `${new Date(Date.now()).toUTCString()}: ${"finished deleting"}`
    );

    // let f = [
    //     new Flight({ hex: 1 }),
    //     new Flight({ hex: 2 }),
    //     new Flight({ hex: 3 }),
    //     new Flight({ hex: 4 }),
    //     new Flight({ hex: 5 }),
    // ];
    let f = [];

    await Flight.bulkSave(f);

    for (let index = 0; index < 20000; index++) {
        f.push(new Flight({ hex: 1000, reg_number: "aksd" }));
    }
    console.log(`${new Date(Date.now()).toUTCString()}: ${"Saving records"}`);
    await Flight.bulkSave(f);
    console.log(
        `${new Date(Date.now()).toUTCString()}: ${"Finished saving records"}`
    );

    for (let index = 0; index < 20000; index++) {
        f[index].lat = 90;
    }

    console.log(`${new Date(Date.now()).toUTCString()}: ${"Saving records"}`);
    await Flight.bulkSave(f);
    console.log(
        `${new Date(Date.now()).toUTCString()}: ${"Finished saving records"}`
    );
}
