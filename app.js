const express = require("express");
const apiRouter = require("./api/routes/quotesRouter.js");

const app = express();

app.use(express.json());

app.use("/api/quotes", apiRouter);

app.use((req, res, next) => {
  res.status(404).json({ message: "Not found" });
  next();
});

module.exports = app;
