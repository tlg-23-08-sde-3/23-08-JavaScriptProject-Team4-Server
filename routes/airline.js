const express = require("express");
const Router = express.Router();
const mongoose = require("mongoose");
const Airline = require("../models/Airline");
const AirlineDefault = require("../default_data/airlines");
const { default: axios } = require("axios");

//Returns a picture given an Aircraft's registration code
Router.get("/api/airline/", async (req, res) => {
    try {
        const iata_code = req.query.iata_code;
        const icao_code = req.query.icao_code;

        let query = {};
        if (iata_code) {
            query.iata_code = iata_code;
        }
        if (icao_code) {
            query.icao_code = icao_code;
        }

        var airlines = await Airline.find(query).exec();
        return res.send(airlines);
    } catch (error) {
        return res
            .status(500)
            .send({ error: "Error processing the request. " + error });
    }
});

Router.get("/api/airline/logo/:iata_code", async (req, res) => {
    try {
        const airline_code = req.params.airline_code;
        // let url = `https://airlabs.co/img/airline/m/${iata_code}.png`;
        const url = `https://pics.avs.io/300/100/${iata_code}.png`;

        try {
            await axios(url);
        } catch (error) {
            return res.send(`./images/default_logo.png`);
        }
        return res.send(url);
    } catch (error) {
        return res
            .status(500)
            .send({ error: "Error processing the request. " + error });
    }
});

Router.post("/api/airline/populatedb", async (req, res) => {
    await Airline.insertMany(AirlineDefault);
    return res.send("ok");
});

module.exports = { Router };
