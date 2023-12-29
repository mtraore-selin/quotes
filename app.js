const express = require("express");
const apiRouter = require("./api/routes/quotesRouter.js");

const app = express();

app.use(express.json());

app.use("/api/quotes", apiRouter);

module.exports = app;
