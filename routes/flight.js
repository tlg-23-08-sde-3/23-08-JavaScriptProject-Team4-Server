const express = require("express");
const Router = express.Router();
const axios = require("axios");
const AirLabs = require("../utils/airlabs");

Router.get("/api/flight/:hex", async (req, res) => {
    try {
        const hex = req.params.hex;

        const result = await AirLabs.getFlightInfoFromAirLabs(hex);

        return res.send(result);
    } catch (error) {
        return res
            .status(500)
            .send({ error: `Error trying to obtain flight info: ${error}` });
    }
});

module.exports = { Router };
