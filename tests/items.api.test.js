const mongoose = require("mongoose")
const supertest = require("supertest")
const Item = require("../models/item")
const User = require("../models/user")
const userHelper = require("./users_helpers")
const itemsHelper = require("./items_helpers")
const app = require("../app")
const api = supertest(app)

let tokens = []

//! Reminder: this test suite contains tests for file upload !//
//! Remember to delete un-needed uploaded files after testing !//

//* This test suite requires /api/users and /api/login to be functional *//
//* and correct *//

beforeAll(async () => {
  await User.deleteMany({})

  for (let user of userHelper.initialUsers) {
    await api.post("/api/users").send(user)

    const response = await api.post("/api/login").send(user)
    tokens.push(response.body.token)
  }
}, 20000)

beforeEach(async () => {
  await Item.deleteMany({})

  for (let item of itemsHelper.initialItems) {
    const itemObj = new Item(item)
    await itemObj.save()
  }
}, 20000)

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

  test("correctly returned first item", async () => {
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

describe("POST to /api/items", () => {
  test("a valid item can be added with a valid existing token", async () => {
    await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length + 1)
  })

  test("new item is stored correctly in database", async () => {
    await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const storedInDB = await Item.findOne({ name: "vintage film camera" })
    expect(storedInDB).toBeDefined()
    expect(storedInDB.id).toBeDefined()
    expect(storedInDB.category).toEqual("Camera")
    expect(storedInDB.condition).toEqual("Visible wear")
    expect(storedInDB.shipping).toBe(false)
    expect(storedInDB.meet).toBe(true)
    expect(storedInDB.description).toEqual("No idea if it works.")
    expect(storedInDB.imagePaths[0]).toContain("vintage-camera-pexels-alex-andrews-1203803.jpg")
    expect(storedInDB.imagePaths[1]).toContain("vintage-camera-pexels-alex-andrews-1983037.jpg")
    expect(storedInDB.datePosted).toBeDefined()
    expect(storedInDB.availability).toBe(true)

    const matchedUser = await User.findOne({ username: userHelper.initialUsers[0].username })
    expect(storedInDB.postedBy).toEqual(matchedUser._id)
  })

  test("reject post request without token", async () => {
    await api
      .post("/api/items")
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(401)

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length)
  })

  test("reject post request with invalid token", async () => {
    await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0].substring(5, 14)}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(401)

    await api
      .post("/api/items")
      .set("Authorization", `basic ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(401)

    await api
      .post("/api/items")
      .set("Authorization", `@@@`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(401)

    await api
      .post("/api/items")
      .set("Authorization", `bearer @@@`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(401)
  })

  test("reject post request with incomplete item info", async () => {
    // no item name
    await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(400)

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length)
  })

  test("reject post request with invalid item category", async () => {
    await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "abc1234")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(400)

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length)
  })

  test("reject post request with invalid item condition", async () => {
    await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "abc1234")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(400)

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length)
  })

  test("reject post request with both exchange method unchecked", async () => {
    await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "false")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(400)

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length)
  })

  test("reject post request without item images", async () => {
    await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .expect(400)

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length)
  })

  test("reject post request with non-image files", async () => {
    await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/non-image.txt")
      .expect(400)

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length)
  })

  test("reject post request with more than 8 images", async () => {
    await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")
      .expect(400)

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length)
  })
})

//* requires GET from /api/items and POST to /api/items to be functional and correct *//
describe("PUT to /api/items/:id", () => {
  test("correctly update item availability with valid token", async () => {
    const objectID = []
    const response = await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")

    objectID.push(JSON.parse(response.text).id)

    // Fetching from the GET endpoint instead of using Item.findById() to
    // simulate how the PUT endpoint will be actually used in the application:
    // User sees data returned from the GET endpoint instead of the mongoDB
    // client
    let originalObject = await api.get(`/api/items/${objectID[0]}`)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    originalObject = JSON.parse(originalObject.text)
    expect(originalObject).toBeDefined()
    expect(originalObject.availability).toBe(true)

    const updatedObject = {
      ...originalObject,
      availability: false,
    }

    await api
      .put(`/api/items/${objectID[0]}`)
      .set("Authorization", `bearer ${tokens[0]}`)
      .send(updatedObject)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    updatedObject.postedBy = originalObject.postedBy.id

    let matchedObject = await Item.findById(objectID[0])
    matchedObject = JSON.parse(JSON.stringify(matchedObject))
    matchedObject.datePosted = new Date(matchedObject.datePosted).toISOString()

    expect(matchedObject).toBeDefined()
    expect(matchedObject).toEqual(updatedObject)
  })

  test("reject update without token", async () => {
    const objectID = []
    const response = await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")

    objectID.push(JSON.parse(response.text).id)

    let originalObject = await api.get(`/api/items/${objectID[0]}`)
    originalObject = JSON.parse(originalObject.text)
    expect(originalObject.availability).toBe(true)


    const updatedObject = {
      ...originalObject,
      availability: false,
    }

    await api
      .put(`/api/items/${objectID[0]}`)
      .send(updatedObject)
      .expect(401)

    originalObject.postedBy = originalObject.postedBy.id

    let matchedObject = await Item.findById(objectID[0])
    matchedObject = JSON.parse(JSON.stringify(matchedObject))

    expect(matchedObject).toEqual(originalObject)
  })

  test("reject update with non-matching token", async () => {
    const objectID = []
    const response = await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")

    objectID.push(JSON.parse(response.text).id)

    let originalObject = await api.get(`/api/items/${objectID[0]}`)
    originalObject = JSON.parse(originalObject.text)
    expect(originalObject.availability).toBe(true)

    const updatedObject = {
      ...originalObject,
      availability: false,
    }

    await api
      .put(`/api/items/${objectID[0]}`)
      .set("Authorization", `bearer ${tokens[1]}`)
      .send(updatedObject)
      .expect(403)

    originalObject.postedBy = originalObject.postedBy.id

    let matchedObject = await Item.findById(objectID[0])
    matchedObject = JSON.parse(JSON.stringify(matchedObject))

    expect(matchedObject).toEqual(originalObject)
  })
})

describe("DELETE from /api/item/:id", () => {
  test("Successfully deleted item with matching token", async () => {
    const objectID = []
    const response = await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")

    objectID.push(JSON.parse(response.text).id)

    await api
      .delete(`/api/items/${objectID[0]}`)
      .set("Authorization", `bearer ${tokens[0]}`)
      .expect(204)

    const matchedItem = await Item.findById(objectID[0])
    expect(matchedItem).toBeNull()

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length)
  })

  test("reject delete request without token", async () => {
    const objectID = []
    const response = await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")

    objectID.push(JSON.parse(response.text).id)

    await api
      .delete(`/api/items/${objectID[0]}`)
      .expect(401)

    const matchedItem = await Item.findById(objectID[0])
    expect(matchedItem).toBeDefined()

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length + 1)
  })

  test("reject delete request with non matching token", async () => {
    const objectID = []
    const response = await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")

    objectID.push(JSON.parse(response.text).id)

    await api
      .delete(`/api/items/${objectID[0]}`)
      .set("Authorization", `bearer ${tokens[1]}`)
      .expect(403)

    const matchedItem = await Item.findById(objectID[0])
    expect(matchedItem).toBeDefined()

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length + 1)
  })

  //* This test requires PUT /api/items/:id to be functional and correct *//
  test("reject request to delete archived item", async () => {
    const objectID = []
    const response = await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[0]}`)
      .field("item-name", "vintage film camera")
      .field("item-category", "Camera")
      .field("item-condition", "Visible wear")
      .field("item-shipping", "false")
      .field("item-meet", "true")
      .field("item-description", "No idea if it works.")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1203803.jpg")
      .attach("item-images", "tests/images/post_items/vintage-camera-pexels-alex-andrews-1983037.jpg")

    objectID.push(JSON.parse(response.text).id)

    const original = await api.get(`/api/items/${objectID[0]}`)

    const updated = {
      ...original,
      availability: false
    }

    await api
      .put(`/api/items/${objectID[0]}`)
      .set("Authorization", `bearer ${tokens[0]}`)
      .send(updated)
      .expect(200)

    await api
      .delete(`/api/items/${objectID[0]}`)
      .set("Authorization", `bearer ${tokens[0]}`)
      .expect(400)

    const matchedItem = await Item.findById(objectID[0])
    expect(matchedItem).toBeDefined()

    const result = await itemsHelper.allItemsFromDB()
    expect(result).toHaveLength(itemsHelper.initialItems.length + 1)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
