const mongoose = require("mongoose")
const supertest = require("supertest")
const bcrypt = require("bcrypt")
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
  test("users are returned as JSON", async () => {
    await api
      .get("/api/users")
      .expect(200)
      .expect("Content-Type", /application\/json/)
  })

  test("successfully returned all users", async () => {
    const response = await api.get("/api/users")
    expect(response.body).toHaveLength(usersHelper.initialUsers.length)
  })

  test("correctly returned first user", async () => {
    const response = await api.get("/api/users")

    expect(response.body[0]).toBeDefined()
    expect(response.body[0].id).toBeDefined()
    expect(response.body[0].password).not.toBeDefined()

    expect(response.body[0].username).toEqual(usersHelper.initialUsers[0].username)
    expect(response.body[0].items).toEqual(usersHelper.initialUsers[0].items)
  })
})

describe("GET from /api/users/:id", () => {
  test("correctly returned first user", async () => {
    const storedInDB = await usersHelper.allUsersFromDB()

    const result = await api
      .get(`/api/users/${storedInDB[0].id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(result.body.id).toEqual(storedInDB[0].id)
    expect(result.body.username).toEqual(storedInDB[0].username)
    expect(result.body.items).toEqual(Array.from([...storedInDB[0].items]))
    expect(result.body.items).toHaveLength(0)
    expect(result.body.password).not.toBeDefined()
  })

  test("reject non-existent ID with 404", async () => {
    const id = await usersHelper.nonExistentUserID()

    await api
      .get(`/api/users/${id}`)
      .expect(404)
  })

  test("reject invalid ID with 404", async () => {
    await api
      .get("/api/users/@@@")
      .expect(404)
  })
})

describe("POST to /api/users", () => {
  test("successfully added a valid user", async () => {
    const newUser = {
      username: "third_username",
      password: "third_password",
      items: []
    }

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const result = await usersHelper.allUsersFromDB()
    expect(result).toHaveLength(usersHelper.initialUsers.length + 1)
  })

  test("new user is correctly stored in database", async () => {
    const newUser = {
      username: "third_username",
      password: "third_password",
      items: []
    }

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const storedInDB = await User.findOne({ username: newUser.username })
    expect(storedInDB).toBeDefined()
    expect(storedInDB.id).toBeDefined()

    const checkPassword = await bcrypt.compare(newUser.password, storedInDB.password)
    expect(checkPassword).toBe(true)

    expect(storedInDB.username).toEqual(newUser.username)
    expect(Array.from([...storedInDB.items])).toEqual(newUser.items)
  })

  test("items field default to empty array if not provided", async () => {
    const newUser = {
      username: "third_username",
      password: "third_password"
    }

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const storedInDB = await User.findOne({ username: newUser.username })
    expect(storedInDB).toBeDefined()

    expect(storedInDB.username).toEqual(newUser.username)
    expect(Array.from([...storedInDB.items])).toEqual([])
    expect(Array.from([...storedInDB.items])).toHaveLength(0)
  })

  test("reject missing username", async () => {
    const newUser = {
      password: "third_password",
      items: []
    }

    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)

    expect(response.body.error).toContain("`username` is required")

    const result = await usersHelper.allUsersFromDB()
    expect(result).toHaveLength(usersHelper.initialUsers.length)
  })

  test("reject missing password", async () => {
    const newUser = {
      username: "third_password",
      items: []
    }

    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)

    expect(response.body.error).toContain("Password must be at least 8 characters long")

    const result = await usersHelper.allUsersFromDB()
    expect(result).toHaveLength(usersHelper.initialUsers.length)
  })

  test("reject username shorter than 8 characters", async () => {
    const newUser = {
      username: "abc",
      password: "third_password",
      items: []
    }

    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)

    expect(response.body.error).toContain("`username` (`abc`) is shorter than")

    const result = await usersHelper.allUsersFromDB()
    expect(result).toHaveLength(usersHelper.initialUsers.length)
  })

  test("reject password shorter than 8 characters", async () => {
    const newUser = {
      username: "third_username",
      password: "abc",
      items: []
    }

    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)

    expect(response.body.error).toContain("Password must be at least 8 characters long")

    const result = await usersHelper.allUsersFromDB()
    expect(result).toHaveLength(usersHelper.initialUsers.length)
  })

  test("reject password same as username", async () => {
    const newUser = {
      username: "third_username",
      password: "third_username",
      items: []
    }

    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)

    expect(response.body.error).toContain("Password must not be the same as username")

    const result = await usersHelper.allUsersFromDB()
    expect(result).toHaveLength(usersHelper.initialUsers.length)
  })

  test("reject repeated username", async () => {
    const newUser = {
      username: "first_username",
      password: "third_password",
      items: []
    }

    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)

    expect(response.body.error).toContain("`username` to be unique")

    const result = await usersHelper.allUsersFromDB()
    expect(result).toHaveLength(usersHelper.initialUsers.length)
  })
})

describe("DELETE from /api/users/:id", () => {
  test("successfully deleted first user from database", async () => {
    let matchedUsers = await User.find({ username: "first_username" })

    await api
      .delete(`/api/users/${matchedUsers[0]._id}`)
      .expect(204)

    const storedInDB = await usersHelper.allUsersFromDB()
    expect(storedInDB).toHaveLength(usersHelper.initialUsers.length - 1)

    matchedUsers = await User.find({ username: "first_username" })
    expect(matchedUsers).toHaveLength(0)
    expect(matchedUsers[0]).not.toBeDefined()
  })
})

describe("PUT to /api/users/:id", () => {
  const newUser = {
    username: "third_username",
    password: "third_password",
    items: []
  }

  beforeEach(async () => {
    User.findOneAndDelete({ username: "third_username" })

    await api
      .post("/api/users")
      .send(newUser)
  })

  test("successfully updated username", async () => {
    const oldMatchedUser = await User.findOne({ username: "third_username" })
    expect(oldMatchedUser).not.toBe(null)

    const updatedUser = {
      username: "fourth_username",
      password: newUser.password,
      items: []
    }

    await api
      .put(`/api/users/${oldMatchedUser._id}`)
      .send(updatedUser)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    let newMatchedUser = await User.findOne({ username: "third_username" })
    expect(newMatchedUser).toBe(null)

    newMatchedUser = await User.findOne({ username: `${updatedUser.username}` })
    expect(newMatchedUser).not.toBe(null)
    expect(newMatchedUser.username).not.toEqual(oldMatchedUser.username)
    expect(Array.from([...newMatchedUser.items])).toHaveLength(Array.from([...oldMatchedUser.items]).length)
    expect(Array.from([...newMatchedUser.items])).toEqual(Array.from([...oldMatchedUser.items]))
    expect(newMatchedUser.password).toEqual(oldMatchedUser.password)
  })

  test("successfully updated password", async () => {
    const oldMatchedUser = await User.findOne({ username: "third_username" })
    expect(oldMatchedUser).not.toBe(null)

    const updatedUser = {
      username: newUser.username,
      password: "fourth_password",
      items: []
    }

    await api
      .put(`/api/users/${oldMatchedUser._id}`)
      .send(updatedUser)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    const newMatchedUser = await User.findOne({ username: "third_username" })
    expect(newMatchedUser).not.toBe(null)
    expect(newMatchedUser.username).toEqual(oldMatchedUser.username)
    expect(Array.from([...newMatchedUser.items])).toHaveLength(Array.from([...oldMatchedUser.items]).length)
    expect(Array.from([...newMatchedUser.items])).toEqual(Array.from([...oldMatchedUser.items]))
    expect(newMatchedUser.password).not.toEqual(oldMatchedUser.password)

    const checkPassword = await bcrypt.compare(updatedUser.password, newMatchedUser.password)
    expect(checkPassword).toBe(true)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
