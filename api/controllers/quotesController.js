const Quote = require("../models/quoteSchema");
const { ERROR_500_MSG, NOT_QUOTE_MSG } = require("../../constants");
exports.get_quotes = async (req, res) => {
  try {
    const quotes = await Quote.find();
    if (quotes.length) {
      res.status(200).json(quotes);
    } else {
      res.status(200).json({ message: "No quotes found" });
    }
  } catch (error) {
    res.status(500).json({ message: ERROR_500_MSG, error });
  }
};

exports.get_quote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (quote) {
      res.status(200).json(quote);
    } else {
      res.status(404).json({ message: NOT_QUOTE_MSG });
    }
  } catch (error) {
    res.status(500).json({ message: ERROR_500_MSG, error });
  }
};
