require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

const { Router } = require("./routes/index");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(Router);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});
