const mongoose = require("mongoose");
const axios = require("axios");

const flightSchema = mongoose.Schema({
    startedDateTime: { type: Number, required: true },
    latestUpdateDateTime: { type: Number, required: true },
    flights: [
        {
            hex: { type: String, required: true },
            reg_number: { type: String },
            lat: { type: Number },
            lng: { type: Number },
            dir: { type: Number },
            updated: { type: Number }, //UNIX timestamp of last aircraft signal.
            flight_iata: { type: String },
            flight_icao: { type: String },

            ///////////
            speed: { type: Number },
            v_speed: { type: Number },
            squawk: { type: String },
            airline_iata: { type: String },
            airline_icao: { type: String },
            alt: { type: Number },
            flight_number: { type: String },
            dep_iata: { type: String },
            dep_icao: { type: String },
            dep_terminal: { type: String },
            dep_gate: { type: String },
            dep_time: { type: String },
            dep_time_ts: { type: String },
            dep_time_utc: { type: String },
            dep_estimated: { type: String },
            dep_estimated_ts: { type: String },
            dep_estimated_utc: { type: String },
            arr_iata: { type: String },
            arr_icao: { type: String },
            arr_terminal: { type: String },
            arr_gate: { type: String },
            arr_baggage: { type: String },
            arr_time: { type: String },
            arr_time_ts: { type: String },
            arr_time_utc: { type: String },
            arr_estimated: { type: String },
            arr_estimated_ts: { type: String },
            arr_estimated_utc: { type: String },
            duration: { type: String }, // 	Estimated flight time (in minutes).
            dep_delayed: { type: String }, //Estimated time of flight departure delay (in minutes).
            arr_delayed: { type: String }, //Estimated time of flight arrival delay (in minutes).

            status: { type: String },
            model: { type: String },
            manufacturer: { type: String },
            type: { type: String },
            duration: { type: String },
            aircraft_icao: { type: String },
            flag: { type: String },
            //Our stuff
            positionHistory: [
                {
                    lat: Number,
                    lng: Number,
                    alt: Number,
                    dir: Number,
                    updated: Number,
                },
            ],
            isActive: { type: Boolean },
        },
    ],
});

// flightSchema.getActiveFlights = function () {
//     console.log("OKOKOKOKOK");
// };

flightSchema.statics.getAllFlights = async function () {
    return await this.find();
};

module.exports = mongoose.model("FlightBackup", flightSchema);
