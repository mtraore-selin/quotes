const mongoose = require("mongoose");
const quotesSchema = new mongoose.Schema(
  {
    quotes: {
      type: String,
      require: true,
    },
    author: {
      type: String,
      require: true,
    },
  },
  { timeseries: true }
);
const Quote = mongoose.model("Quote", quotesSchema);
module.exports = Quote; //export
