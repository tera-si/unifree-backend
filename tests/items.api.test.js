const mongoose = require("mongoose")
const supertest = require("supertest")
const Item = require("../models/item")
const User = require("../models/user")
const userHelper = require("./users_helpers")
const itemsHelper = require("./items_helpers")
const app = require("../app")
const api = supertest(app)

beforeAll(async () => {
  await User.deleteMany({})

  for (let user of userHelper.initialUsers) {
    await api.post("/api/users").send(user)
  }
}, 20000)

beforeEach(async () => {
  await Item.deleteMany({})

  for (let item of itemsHelper.initialItems) {
    const itemObj = new Item(item)
    await itemObj.save()
  }
})

describe("GET from /api/items", () => {
  test("items are returned as JSON", async () => {
    await api
      .get("/api/items")
      .expect(200)
      .expect("Content-Type", /application\/json/)
  })

  test("successfully returned all items", async () => {
    const response = await api.get("/api/items")
    expect(response.body).toHaveLength(itemsHelper.initialItems.length)
  })

  test("correct returned first item", async () => {
    const response = await api.get("/api/items")
    expect(response.body[0]).toBeDefined()

    const originalObject = { ...itemsHelper.initialItems[0] }
    originalObject.datePosted = originalObject.datePosted.toISOString()

    const responseObject = { ...response.body[0] }
    delete responseObject.id

    expect(responseObject).toEqual(originalObject)
  })
})

describe("GET from /api/items/:id", () => {
  test("correctly returned first item", async () => {
    const storedInDB = await itemsHelper.allItemsFromDB()

    const result = await api
      .get(`/api/items/${storedInDB[0].id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(result.body).toBeDefined()

    const originalObject = { ...storedInDB[0] }
    originalObject.datePosted = originalObject.datePosted.toISOString()

    expect(result.body).toEqual(originalObject)
  })

  test("reject non-existent ID with 404", async () => {
    const id = await itemsHelper.nonExistentItemID()

    await api.get(`/api/items/${id}`).expect(404)
  })

  test("reject invalid ID with 400", async () => {
    await api.get("/api/items/@@@").expect(400)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
