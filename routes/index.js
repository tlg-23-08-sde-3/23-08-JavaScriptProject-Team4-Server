const express = require("express");
const Router = express.Router();
const axios = require("axios");

const Scrapper = require("../utils/scrapper");

const MAX_AIRPLANES = 1000;

Router.get("/api", (req, res) => {
    console.log(1);
    res.send("Hello");
});

//Returns a picture given an Aircraft's registration code
// Router.get("/api/airplane/picture/:registration", async (req, res) => {
//     const registration = req.params.registration;
//     const url = await Scrapper.JetPhotosScrapPictures(registration);

//     res.send({ picture: url });
// });

// DEPRECATED
// Router.get("/api/flights/", (req, res) => {
//     const result = flights_snapshot.map(function (flight) {
//         return {
//             hex: flight.hex,
//             lat: flight.lat,
//             lng: flight.lng,
//             dir: flight.dir,
//             flight_icao: flight.flight_icao,
//         };
//     });
//     res.send(result);
// });

function randomFromList(list) {
    const random = Math.floor(Math.random() * list.length);
    return list[random];
}

function getSecondFromListIfAny(list) {
    return list.length > 1 ? list[1] : list[0];
}

// @method contains (latlng: LatLng): Boolean
// Returns `true` if the rectangle contains the given point.
// I haven't tested this, this function could be used if we decide to limit the airplanes that appear in the screen in the server side
// Downside of this would be that the server would need to do all this math, benefit would be that it will be sending less data
function contains(point, rectangle) {
    return (
        point.lat >= rectangle.sw.lat &&
        point.lat <= rectangle.ne.lat &&
        point.lng >= rectangle.sw.lng &&
        point.lng <= rectangle.ne.lng
    );
}

module.exports = { Router };
