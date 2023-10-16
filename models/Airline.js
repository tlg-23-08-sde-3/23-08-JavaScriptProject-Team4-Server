const mongoose = require("mongoose");
const axios = require("axios");

const airlineSchema = mongoose.Schema({
    //hex: { type: String, require: true },
    name: { type: String },
    iata_code: { type: String },
    icao_code: { type: String },
});

module.exports = mongoose.model("Airline", airlineSchema);
