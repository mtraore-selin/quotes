## Express Microservice

### About

This is a simple express microservice. Client can get all quotes, one quote by id, delete and update quote by id. Also clinet can post a new quote and if required fields are not provided - random quote is fetched from a downstream API

## Learning goals:

- Implement an HTTP API web server microservice.
- Interact with downstream APIs.
- Connect server to NoSQL database .
- Test API endpoints and mock downstreams API requests.

## Technologies Used:

- Node | Express
- MongoDB | Mongoose | MongoDB Atlas | MongoDB Compass
- Jest | Supertest | Nock
- Node Fetch

## REST API Endpoints:

Local Server

`'http://localhost:port/api/quotes'`

- `GET`
- `POST`

`'http://localhost:port/api/quotes/:id'`

- `GET`
- `PATCH`
- `DELETE`

Production

`https://remote-base-url/api/quotes`

- `GET`
- `POST`

`https://remote-base-url/api/quotes/:id`

- `GET`
- `PATCH`
- `DELETE`

## Testing

- Utilized hooks to connect to local MongoDB before all tests run and disconnect after all tests finish running. Also seed testing database with testing data before each test and delete data after each test.

```
const mongoose = require("mongoose");
const nock = require("nock");
const supertest = require("supertest");

const app = require("../../app");
const request = supertest(app);
const Quote = require("../models/quoteSchema.js");
const testQuoteData = require("./quotes.test.data.js");
const quotesController = require("../controllers/quotesController");
const {
  ERROR_500_MSG,
  NOT_QUOTES_MSG,
  NOT_QUOTE_MSG,
} = require("../../constants.js");
describe("Quote API endpoints", () => {
  const mockRelationModel = {
    find: jest.fn().mockReturnThis(),
    exec: jest.fn().mockReturnThis(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOne: jest.fn(),
  };
  const mockQuote = {
    text: "Mocked Quote",
    author: "Mocked Author",
  };

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

  const executeDeleteQuote = async (id) => {
    const req = { params: { id } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    await quotesController.delete_quote(req, res);
    return res;
  };

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
    jest.spyOn(Quote, "findById").mockImplementationOnce(() => undefined);

    // Perform the request
    const res = await request.get("/api/quotes/5f8787878787878787878787");

    // Assertions
    expect(res.status).toBe(404);
    expect(res.body.message).toBe(NOT_QUOTE_MSG);
  });

  it("POST | handles error 500 when creating a new quote", async () => {
    jest
      .spyOn(Quote.prototype, "save")
      .mockImplementationOnce(() => Promise.reject("Failed to save"));

    const res = await request.post("/api/quotes").send(testQuoteData[0]);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe(ERROR_500_MSG);
  });

  it("POST | creates a new quote", async () => {
    const res = await request.post("/api/quotes").send(testQuoteData[0]);

    expect(res.status).toBe(200);
    expect(res.body.quote).toBe(testQuoteData[0].quote);
    expect(res.body.author).toBe(testQuoteData[0].author);
  });

  it("POST | creates a new quote from external API when body is incomplete", async () => {
    nock("https://type.fit/api").get("/quotes").reply(200, [mockQuote]);

    const res = await request.post("/api/quotes").send({});

    // Assertions
    expect(res.status).toBe(200);
    expect(res.body.quote).toBe(mockQuote.text);
    expect(res.body.author).toBe(mockQuote.author);
  });

  it("PUT | error 500 when updating a quote", async () => {
    const res = await request.patch(`/api/quotes/ee-test`).send(mockQuote);
    expect(res.status).toBe(500);
  });

  it("PUT | error 404 when updating a quote", async () => {
    const res = await request
      .patch(`/api/quotes/5f8787878787878787878787`)
      .send(mockQuote);

    expect(res.status).toBe(404);
  });

  it("PUT | update a quote", async () => {
    const author = "Updated Author";
    const quote = await Quote.find({ quote: testQuoteData[0].quote });

    const res = await request
      .patch(`/api/quotes/${quote[0]._id}`)
      .send({ author, quote: "quote updated" });
    const { author: resAuthor } = res.body;

    expect(res.status).toBe(200);
    expect(resAuthor).toBe(author);
  });

  it("DELETE | delete a quote and return a success message", async () => {
    const quote = await Quote.findOne({});
    const res = await executeDeleteQuote(quote._id);
    expect(res.json).toHaveBeenCalledWith({ message: "Quote deleted" });

    const deletedQuote = await Quote.findById(quote._id);
    expect(deletedQuote).toBeNull();
  });
  it("DELETE | delete a quote (db) and return a success message", async () => {
    const quote = await Quote.find({ quote: testQuoteData[0].quote });
    const id = quote[0]._id;
    const res = await request.delete(`/api/quotes/${id}`);

    const deletedQuote = await Quote.findById(id);
    expect(deletedQuote).toBeNull();
  });

  it("DELETE | return a 404 status and message if quote not found", async () => {
    const res = await executeDeleteQuote("5f8787878787878787878787");

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: NOT_QUOTE_MSG });
  });
  it("DELETE | return a 404 status and message if quote (db) not found", async () => {
    const res = await request.delete(`/api/quotes/5f8787878787878787878787`);
    expect(res.body.message).toBe(NOT_QUOTE_MSG);
  });

  it("DELETE | return a 500 status and error message if an error occurs", async () => {
    const res = await executeDeleteQuote("invalidObjectId");

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: ERROR_500_MSG,
      error: expect.any(Error),
    });
  });
  it("DELETE | return a 500 status and error message if an error occurs (db)", async () => {
    const res = await request.delete(
      `/api/quotes/5f878787878788787invalidObjectId`
    );
    expect(res.body.message).toBe(ERROR_500_MSG);
  });
});
```

passing
![Alt Text](cov-quote-crud.png)

```
Debugger attached.
 PASS  api/tests/quotes.test.js
  Quote API endpoints
    ✓ GET | get all quotes from db (30 ms)
    ✓ GET | error when fetching quotes is empty (8 ms)
    ✓ GET | error when fetching quotes (8 ms)
    ✓ GET | get quote by id (12 ms)
    ✓ GET | error when fetching quote by id (8 ms)
    ✓ GET | not found when fetching quote by id (7 ms)
    ✓ POST | handles error 500 when creating a new quote (18 ms)
    ✓ POST | creates a new quote (43 ms)
    ✓ POST | creates a new quote from external API when body is incomplete (17 ms)
    ✓ PUT | error 500 when updating a quote (10 ms)
    ✓ PUT | error 404 when updating a quote (10 ms)
    ✓ PUT | update a quote (11 ms)
    ✓ DELETE | delete a quote and return a success message (9 ms)
    ✓ DELETE | delete a quote (db) and return a success message (8 ms)
    ✓ DELETE | return a 404 status and message if quote not found (5 ms)
    ✓ DELETE | return a 404 status and message if quote (db) not found (6 ms)
    ✓ DELETE | return a 500 status and error message if an error occurs (5 ms)
    ✓ DELETE | return a 500 status and error message if an error occurs (db) (5 ms)

Waiting for the debugger to disconnect...
Waiting for the debugger to disconnect...
Waiting for the debugger to disconnect...
Waiting for the debugger to disconnect...
-----------------------|---------|----------|---------|---------|-------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------|---------|----------|---------|---------|-------------------
All files              |     100 |      100 |     100 |     100 |
 Quote                 |     100 |      100 |     100 |     100 |
  app.js               |     100 |      100 |     100 |     100 |
  constants.js         |     100 |      100 |     100 |     100 |
 Quote/api/controllers |     100 |      100 |     100 |     100 |
  quotesController.js  |     100 |      100 |     100 |     100 |
 Quote/api/models      |     100 |      100 |     100 |     100 |
  quoteSchema.js       |     100 |      100 |     100 |     100 |
 Quote/api/routes      |     100 |      100 |     100 |     100 |
  quotesRouter.js      |     100 |      100 |     100 |     100 |
 Quote/api/tests       |     100 |      100 |     100 |     100 |
  quotes.test.data.js  |     100 |      100 |     100 |     100 |
-----------------------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        1.528 s, estimated 2 s
Ran all test suites related to changed files.
```
