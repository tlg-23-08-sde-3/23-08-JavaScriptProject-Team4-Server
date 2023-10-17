const mongoose = require("mongoose");

const Flight = require("../models/Flight");

const mongoDB_URL = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.ln73gxc.mongodb.net/?retryWrites=true&w=majority`;

module.exports = {
    connect: async () => {
        try {
            console.log(`Connecting to MongoDB database...`);
            await mongoose.connect(mongoDB_URL);
            console.log("connected to MongoDB with mongoose.");
        } catch (error) {
            console.log(error);
        }
    },
    getFlights: async () => {
        return await Flight.find();
    },
};
