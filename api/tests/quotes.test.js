const mongoose = require("mongoose");
const nock = require("nock");
const supertest = require("supertest");

const app = require("../../app");
const request = supertest(app);
const Quote = require("../models/quoteSchema.js");
const testQuoteData = require("./quotes.test.data.js");
const {
  ERROR_500_MSG,
  NOT_QUOTES_MSG,
  NOT_QUOTE_MSG,
} = require("../../constants.js");
describe("Quote API endpoints", () => {
  beforeAll(async () => {
    //TODO: put this to a separate file (db.js)
    await mongoose.connect("mongodb://localhost:27017/test");
  });

  beforeEach(async () => {
    for (const quote of testQuoteData) {
      const newQuote = new Quote({ quote: quote.quote, author: quote.author });
      await newQuote.save();
    }
  });

  afterEach(async () => {
    await Quote.deleteMany({});
  });
  beforeAll(async () => {
    await Quote.deleteMany({});
  });

  afterAll(async () => {
    await Quote.deleteMany({});
    await mongoose.connection.close();
  });

  it("GET | get all quotes from db", async () => {
    const res = await request.get("/api/quotes");

    expect(res.status).toBe(200);
    // Check the content of the quotes
    for (let i = 0; i < testQuoteData.length; i++) {
      expect(res.body[i].quote).toBe(testQuoteData[i].quote);
      expect(res.body[i].author).toBe(testQuoteData[i].author);
    }
  });

  it("GET | error when fetching quotes is empty", async () => {
    // Mock Quote.find to throw an error
    jest.spyOn(Quote, "find").mockImplementationOnce(() => []);

    // Perform the request
    const res = await request.get("/api/quotes");

    // Assertions
    expect(res.status).toBe(200);
    expect(res.body.message).toBe(NOT_QUOTES_MSG);
  });

  it("GET | error when fetching quotes", async () => {
    // Mock Quote.find to throw an error
    jest.spyOn(Quote, "find").mockImplementationOnce(() => {
      throw new Error("Mocked error");
    });

    // Perform the request
    const res = await request.get("/api/quotes");

    // Assertions
    expect(res.status).toBe(500);
    expect(res.body.message).toBe(ERROR_500_MSG);
  });

  it("GET | get quote by id", async () => {
    const quote = await Quote.find({ quote: testQuoteData[0].quote });
    const res = await request.get(`/api/quotes/${quote[0]._id}`);

    expect(res.status).toBe(200);
    expect(res.body.quote).toBe(testQuoteData[0].quote);
    expect(res.body.author).toBe(testQuoteData[0].author);
  });

  it("GET | error when fetching quote by id", async () => {
    // Mock Quote.findById to throw an error
    jest.spyOn(Quote, "findById").mockImplementationOnce(() => {
      throw new Error("Mocked error");
    });

    // Perform the request
    const res = await request.get("/api/quotes/5f8787878787878787878787");

    // Assertions
    expect(res.status).toBe(500);
    expect(res.body.message).toBe(ERROR_500_MSG);
  });
  it("GET | not found when fetching quote by id", async () => {
    // Mock Quote.findById to throw an error
    jest.spyOn(Quote, "findById").mockImplementationOnce(() => undefined);

    // Perform the request
    const res = await request.get("/api/quotes/5f8787878787878787878787");

    // Assertions
    expect(res.status).toBe(404);
    expect(res.body.message).toBe(NOT_QUOTE_MSG);
  });
});
