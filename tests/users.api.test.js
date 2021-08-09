const mongoose = require("mongoose")
const supertest = require("supertest")
const User = require("../models/user")
const usersHelper = require("./users_helpers")
const app = require("../app")
const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})

  for (let user of usersHelper.initialUsers) {
    const userObj = new User(user)
    await userObj.save()
  }
}, 20000)

describe("GET from /api/users", () => {
  test ("users are returned as JSON", async () => {
    await api
      .get("/api/users")
      .expect(200)
      .expect("Content-Type", /application\/json/)
  })

  test ("successfully returned all users", async () => {
    const response = await api.get("/api/users")
    expect(response.body).toHaveLength(usersHelper.initialUsers.length)
  })

  test ("correctly returned first user", async () => {
    const response = await api.get("/api/users")

    expect(response.body[0]).toBeDefined()
    expect(response.body[0].id).toBeDefined()
    expect(response.body[0].password).not.toBeDefined()

    const expected = {
      username: usersHelper.initialUsers[0].username,
      items: usersHelper.initialUsers[0].items
    }

    const received = {
      username: response.body[0].username,
      items: response.body[0].items
    }

    expect(received).toEqual(expected)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
