//According to AirLabs the API won't provide to much info about the aiports while we use the free plan
//Found this website that gives you a spreadsheet what we need https://ourairports.com/data/
//Then parsed to JSON using https://csvjson.com
//Importing this data into our database.
const mongoose = require("mongoose");
const axios = require("axios");

const airportSchema = mongoose.Schema({
    id: { type: Number },
    icao_code: { type: String },
    iata_code: { type: String },
    name: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    alt: { type: Number },
    continent: { type: String },
    country_code: { type: String },
    iso_region: { type: String },
    city: { type: String },
    website: { type: String },
    wikipedia_link: { type: String },
});

module.exports = mongoose.model("Airport", airportSchema);
