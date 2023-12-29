const Quote = require("../models/quoteSchema");
const { ERROR_500_MSG, NOT_QUOTE_MSG } = require("../../constants");

const fetch = require("node-fetch");

exports.post_quote = async (req, res) => {
  try {
    let quote;

    if (req.body.quote && req.body.author) {
      quote = {
        text: req.body.quote,
        author: req.body.author,
      };
    } else {
      const response = await fetch("https://type.fit/api/quotes");
      const quotes = await response.json();
      quote = quotes[Math.floor(Math.random() * quotes.length)];
    }

    const newQuote = new Quote({
      quote: quote.text,
      author: quote.author,
    });

    await newQuote.save();
    res.status(200).json(newQuote);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

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

exports.update_quote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (quote) {
      res.status(200).json(quote);
    } else {
      res.status(404).json({ message: NOT_QUOTE_MSG });
    }
  } catch (error) {
    res.status(500).json({ message: ERROR_500_MSG, error });
  }
};

exports.delete_quote = async (req, res) => {
  try {
    const result = await Quote.findByIdAndDelete(req.params.id);

    if (result) {
      res.json({ message: "Quote deleted" });
    } else {
      res.status(404).json({ message: "Quote not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};
