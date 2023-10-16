const mongoose = require("mongoose");
const axios = require("axios");

const airportSchema = mongoose.Schema({
    name: { type: String },
    iata_code: { type: String },
    icao_code: { type: String },
    lat: { type: String },
    lng: { type: String },
    alt: { type: String },
    city: { type: String },
    city_code: { type: String },
    un_locode: { type: String },
    country_code: { type: String },
});

module.exports = mongoose.model("Airport", airportSchema);
