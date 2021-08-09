const mongoose = require("mongoose")
const supertest = require("supertest")
const app = require("../app")
const api = supertest(app)

test("connected to test database", async () => {
  await api.get("/api/users").expect(200).expect("Content-Type", /application\/json/)
})

afterAll(() => {
  mongoose.connection.close()
})
