const mongoose = require("mongoose")
const supertest = require("supertest")
const jwt = require("jsonwebtoken")
const usersHelper = require("./users_helpers")
const User = require("../models/user")
const app = require("../app")
const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})

  for (let user of usersHelper.initialUsers) {
    await api
      .post("/api/users")
      .send(user)
  }
}, 20000)

describe("POST to /api/login", () => {
  test("Login as registered user succeeds", async () => {
    const response = await api
      .post("/api/login")
      .send(usersHelper.initialUsers[0])
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(response.body.token).toBeDefined()
  })

  test("Returned correct token on successful login", async () => {
    const response = await api
      .post("/api/login")
      .send(usersHelper.initialUsers[0])
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(response.body.token).toBeDefined()

    const decoded = jwt.verify(response.body.token, process.env.SECRET_KEY)
    expect(decoded.id).toBeDefined()

    const matchedUser = await User.findById(decoded.id)
    expect(matchedUser).toBeDefined()
    expect(matchedUser.username).toEqual(usersHelper.initialUsers[0].username)
  })

  test("Reject login with incorrect password", async () => {
    const newLogin = { ...usersHelper.initialUsers[0], password: "incorrect" }

    const response = await api
      .post("/api/login")
      .send(newLogin)
      .expect(401)

    expect(response.body.token).not.toBeDefined()
  })

  test("Reject login with non-registered user", async () => {
    const newLogin = {
      "username": "third_username",
      "password": "third_password",
      "items": []
    }

    const response = await api
      .post("/api/login")
      .send(newLogin)
      .expect(401)

    expect(response.body.token).not.toBeDefined()
  })
})

afterAll(() => {
  mongoose.connection.close()
})
