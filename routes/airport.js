const express = require("express");
const Router = express.Router();
const mongoose = require("mongoose");
const Airport = require("../models/Airport");

const AirportDefault = require("../default_data/airports");

//Returns an airport given the iata_code and/or the icao_code
Router.get("/api/airport/", async (req, res) => {
    try {
        const iata_code = req.query.iata_code;
        const icao_code = req.query.icao_code;

        let query = {};
        if (icao_code) {
            query.icao_code = icao_code;
        }
        if (iata_code) {
            query.iata_code = iata_code;
        }

        var airports = await Airport.find(query);
        if (airports?.length > 0) {
            return res.send(airports[0]);
        } else {
            res.status(500).send({
                error: `No airport found with IATA: ${iata_code} and ICAO: ${icao_code}`,
            });
        }
    } catch (error) {
        res.status(500).send({ error: error });
    }
});

Router.post("/api/airport/populatedb", async (req, res) => {
    try {
        await Airport.insertMany(AirportDefault);
        return res.send({ status: "ok", total: AirportDefault.length });
    } catch (error) {
        return res.status(500).send({
            error: error,
            status: `Error saving Airports to the databse, check DB connection and try again: ${error}`,
        });
    }
});

module.exports = { Router };
