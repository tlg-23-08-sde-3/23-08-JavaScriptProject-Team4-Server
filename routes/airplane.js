const express = require("express");
const Router = express.Router();
const mongoose = require("mongoose");
const Scrapper = require("../utils/scrapper");
const Airplane = require("../models/Airplane");

//Returns a picture given an Aircraft's registration code
Router.get("/api/airplane/picture/:registration", async (req, res) => {
    const registration = req.params.registration;

    try {
        if (registration) {
            var airplane = await Airplane.findOne({ reg_number: registration });
            if (airplane && airplane.photoURL) {
                return res.send({ picture: airplane.photoURL });
            } else {
                const url = await Scrapper.JetPhotosScrapPictures(registration);
                airplane = new Airplane({
                    reg_number: registration,
                    photoURL: url,
                });
                await airplane.save();
                return res.send({ picture: url });
            }
        } else {
            return res.status(500).send("ERROR in the request.");
        }
    } catch (error) {
        return res
            .status(500)
            .send({ error: "ERROR processing the request. " + error });
    }
});

module.exports = { Router };
