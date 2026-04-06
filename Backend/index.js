require("dotenv").config();
const express = require("express");
const cors = require("cors");
const uploadRoute = require("./paths/upload");
const queryRoute = require("./paths/query");


const app = express();
app.use(cors());
app.use(express.json());

app.use("/upload", uploadRoute);
app.use("/query", queryRoute);

app.listen(process.env.PORT, () => console.log("Server running on port " + process.env.PORT));