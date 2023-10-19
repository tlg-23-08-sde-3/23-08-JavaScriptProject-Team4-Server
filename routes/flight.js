const express = require("express");
const Router = express.Router();
const axios = require("axios");
const AirLabs = require("../utils/airlabs");

Router.get("/api/flight/", async (req, res) => {
    try {
        const hex = req.query.hex;
        const iata_code = req.query.iata_code;
        const icao_code = req.query.icao_code;

        const result = await AirLabs.getFlightInfoFromAirLabs(
            hex,
            iata_code,
            icao_code
        );

        return res.send(result);
    } catch (error) {
        console.log(
            "============ ERROR IN /api/flight/ ENDPOINT ============="
        );
        return res
            .status(500)
            .send({ error: `Error trying to obtain flight info: ${error}` });
    }
});

module.exports = { Router };
