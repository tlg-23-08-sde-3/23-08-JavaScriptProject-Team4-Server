const express = require("express");
const Router = express.Router();
const mongoose = require("mongoose");
const Airport = require("../models/Airport");

//Returns a picture given an Aircraft's registration code
Router.get("/api/airport/", async (req, res) => {
    const iata_code = req.params.iata_code;
    const icao_code = req.params.icao_code;

    var airports = await Airport.find();
    return res.send(airports);
});

Router.post("/api/airport/populatedb", async (req, res) => {});

module.exports = { Router };
