const mongoose = require("mongoose");
const Quote = require("../models/quoteSchema.js");
const testQuoteData = require("./quotes.test.data.js");
describe("Quote API endpoints", () => {
  beforeAll(async () => {
    //TODO: put this to a separate file (db.js)
    await mongoose.connect("mongodb://localhost:27017/test", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {});

  it("add ", () => {
    expect(true).toBe(true);
  });
});
