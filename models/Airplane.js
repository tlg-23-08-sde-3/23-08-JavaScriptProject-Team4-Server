const mongoose = require("mongoose");
const axios = require("axios");

//This Schema stores any information related to Airplanes
//Like their registration number
//One important field wold be the photoURL, this photo would be obtained by scrapping https://www.jetphotos.com,
//      by storing the photo url in a database we can check first if the photo URL exists to avoid scrapping the same photo twice
const airplaneSchema = mongoose.Schema({
    //hex: { type: String, require: true },
    reg_number: { type: String },
    photoURL: { type: String },
});

module.exports = mongoose.model("Airplane", airplaneSchema);
