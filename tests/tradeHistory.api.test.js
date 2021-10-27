const mongoose = require("mongoose")
const supertest = require("supertest")
const User = require("../models/user")
const Item = require("../models/item")
const TradeHistory = require("../models/tradeHistory")
const userHelper = require("./users_helpers")
const itemHelper = require("./items_helpers")
const tradeHistoryHelper = require("./tradeHistory_helper")
const app = require("../app")
const api = supertest(app)

//* This test suite requires /api/users, /api/login, and /api/items to be *//
//* functional and correct *//

let tokens = []
let userIDs = []
let itemIDs = []

const thirdUser = {
  username: "third_username",
  password: "third_password",
  items: []
}
const thirdItem = {
  name: "Beige Fedora",
  category: "Fashion accessory",
  condition: "New",
  shipping: true,
  meet: true,
  description: "Brand new never wore. Beige Fedora",
  imagePaths: [
    "fedora-pexels-rachel-claire-6123270.jpg"
  ],
  datePosted: new Date(),
  availability: true
}

beforeAll(async () => {
  await User.deleteMany({})
  await Item.deleteMany({})

  for (let user of userHelper.initialUsers) {
    await api.post("/api/users").send(user)

    const response = await api.post("/api/login").send(user)
    tokens.push(response.body.token)
    userIDs.push(response.body.id)
  }

  await api.post("/api/users").send(thirdUser)
  let response = await api.post("/api/login").send(thirdUser)
  tokens.push(response.body.token)
  userIDs.push(response.body.id)

  let i = 0
  for (let item of itemHelper.initialItems) {
    const response = await api
      .post("/api/items")
      .set("Authorization", `bearer ${tokens[i]}`)
      .field("item-name", item.name)
      .field("item-category", item.category)
      .field("item-condition", item.condition)
      .field("item-shipping", item.shipping)
      .field("item-meet", item.meet)
      .field("item-description", item.description)
      .attach("item-images", `tests/images/post_items/${item.imagePaths[0]}`)

    itemIDs.push(response.body.id)
    i++
  }

  response = await api
    .post("/api/items")
    .set("Authorization", `bearer ${tokens[2]}`)
    .field("item-name", thirdItem.name)
    .field("item-category", thirdItem.category)
    .field("item-condition", thirdItem.condition)
    .field("item-shipping", thirdItem.shipping)
    .field("item-meet", thirdItem.meet)
    .field("item-description", thirdItem.description)
    .attach("item-images", `tests/images/post_items/${thirdItem.imagePaths[0]}`)

  itemIDs.push(response.body.id)
}, 20000)

beforeEach(async () => {
  await TradeHistory.deleteMany({})

  const entry1 = new TradeHistory({
    itemOwner: userIDs[0],
    item: itemIDs[0],
    tradedWith: userIDs[1],
    dateDelisted: new Date()
  })

  await entry1.save()

  const entry2 = new TradeHistory({
    itemOwner: userIDs[1],
    item: itemIDs[1],
    tradedWith: userIDs[0],
    dateDelisted: new Date()
  })

  await entry2.save()
})

describe("GET from /api/tradehistory", () => {
  test("entries are returned as JSON when token was provided", async () => {
    await api
      .get("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[0]}`)
      .expect(200)
      .expect("Content-Type", /application\/json/)
  })

  test("successfully returned all entries when token was provided", async () => {
    const response = await api
      .get("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[0]}`)

    expect(response.body).toHaveLength(2)
  })

  test("correctly returned first entry when token was provided", async () => {
    const response = await api
      .get("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[1]}`)

    expect(response.body[0]).toBeDefined()

    expect(response.body[0].id).toBeDefined()
    expect(response.body[0].dateDelisted).toBeDefined()

    const receivedObj = { ...response.body[0] }
    delete receivedObj.id
    delete receivedObj.dateDelisted

    const expectedObj = {
      itemOwner: {
        username: userHelper.initialUsers[1].username,
        id: userIDs[1]
      },
      item: {
        name: itemHelper.initialItems[1].name,
        id: itemIDs[1]
      },
      tradedWith: {
        username: userHelper.initialUsers[0].username,
        id: userIDs[0]
      }
    }

    expect(JSON.stringify(receivedObj)).toEqual(JSON.stringify(expectedObj))
  })

  test("reject request without token", async () => {
    await api
      .get("/api/tradehistory")
      .expect(401)
  })

  test("reject requests with invalid token", async () => {
    await api
      .get("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[0].substring(4)}`)
      .expect(401)

    await api
      .get("/api/tradehistory")
      .set("Authorization", `bearer abc123`)
      .expect(401)

    await api
      .get("/api/tradehistory")
      .set("Authorization", `bearer @@@`)
      .expect(401)

    await api
      .get("/api/tradehistory")
      .set("Authorization", `basic ${tokens[0]}`)
      .expect(401)

    await api
      .get("/api/tradehistory")
      .set("Authorization", `${tokens[0]}`)
      .expect(401)
  })
})

describe("GET from /api/tradehistory/:id", () => {
  test("entries are returned as JSON", async () => {
    const inDB = await TradeHistory.find({})

    await api
      .get(`/api/tradehistory/${inDB[0]._id}`)
      .set("Authorization", `bearer ${tokens[0]}`)
      .expect(200)
      .expect("Content-Type", /application\/json/)
  })

  test("correctly returned first entry", async () => {
    const inDB = await TradeHistory.find({})

    const response = await api
      .get(`/api/tradehistory/${inDB[0]._id}`)
      .set("Authorization", `bearer ${tokens[0]}`)
      .expect(200)

    expect(response.body).toBeDefined()
    expect(response.body.dateDelisted).toBeDefined()
    expect(response.body.id).toBeDefined()

    const receivedObj = { ...response.body }
    delete receivedObj.id
    delete receivedObj.dateDelisted

    const expectedObj = {
      itemOwner: {
        username: userHelper.initialUsers[0].username,
        id: userIDs[0]
      },
      item: {
        name: itemHelper.initialItems[0].name,
        id: itemIDs[0]
      },
      tradedWith: {
        username: userHelper.initialUsers[1].username,
        id: userIDs[1]
      },
    }

    expect(JSON.stringify(receivedObj)).toEqual(JSON.stringify(expectedObj))
  })

  test("reject request to history user didn't take part in", async () => {
    const inDB = await TradeHistory.find({})

    await api
      .get(`/api/tradehistory/${inDB[0]._id}`)
      .set("Authorization", `bearer ${tokens[2]}`)
      .expect(403)
  })

  test("reject non-existent ID with 404", async () => {
    const id = await tradeHistoryHelper.nonExistentHistoryID(userIDs[0], itemIDs[0], userIDs[1])

    await api
      .get(`/api/tradehistory/${id}`)
      .set("Authorization", `bearer ${tokens[0]}`)
      .expect(404)
  })

  test("reject invalid ID with 400", async () => {
    await api
      .get("/api/tradehistory/@@@")
      .set("Authorization", `bearer ${tokens[0]}`)
      .expect(400)
  })

  test("reject request without token", async () => {
    const inDB = await TradeHistory.find({})

    await api
      .get(`/api/tradehistory/${inDB[0]._id}`)
      .expect(401)
  })

  test("reject requests with invalid token", async () => {
    const inDB = await TradeHistory.find({})

    await api
      .get(`/api/tradehistory/${inDB[0]._id}`)
      .set("Authorization", `bearer ${tokens[0].substring(4)}`)
      .expect(401)

    await api
      .get(`/api/tradehistory/${inDB[0]._id}`)
      .set("Authorization", `bearer abc123`)
      .expect(401)

    await api
      .get(`/api/tradehistory/${inDB[0]._id}`)
      .set("Authorization", `bearer @@@`)
      .expect(401)

    await api
      .get(`/api/tradehistory/${inDB[0]._id}`)
      .set("Authorization", `basic ${tokens[0]}`)
      .expect(401)

    await api
      .get(`/api/tradehistory/${inDB[0]._id}`)
      .set("Authorization", `${tokens[0]}`)
      .expect(401)
  })
})

describe("POST to /api/tradehistory", () => {
  test("successfully added a valid entry with valid and matching token", async () => {
    const newEntry = {
      item: itemIDs[2],
      tradedWith: userIDs[0]
    }

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[2]}`)
      .send(newEntry)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const result = await TradeHistory.find({})
    expect(result).toHaveLength(2 + 1)
  })

  test("new entry is correctly stored in database", async () => {
    const newEntry = {
      item: itemIDs[2],
      tradedWith: userIDs[0]
    }

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[2]}`)
      .send(newEntry)

    const result = await TradeHistory.find({ itemOwner: userIDs[2] })
    expect(result).toHaveLength(1)
    expect(result[0].dateDelisted).toBeDefined()
    expect(result[0]._id).toBeDefined()

    const receivedObj = { ...JSON.parse(JSON.stringify(result[0])) }
    delete receivedObj.id
    delete receivedObj.dateDelisted

    const expectedObj = { ...newEntry }
    expectedObj.itemOwner = userIDs[2]

    expect(receivedObj).toEqual(expectedObj)
  })

  test("reject request with invalid user selected", async () => {
    const newEntry = {
      item: itemIDs[2],
      tradedWith: -1
    }

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[2]}`)
      .send(newEntry)
      .expect(400)

    const result = await TradeHistory.find({})
    expect(result).toHaveLength(2)
  })

  test("reject request with non existent traded with user", async () => {
    const newEntry = {
      item: itemIDs[2],
      tradedWith: await userHelper.nonExistentUserID()
    }

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[2]}`)
      .send(newEntry)
      .expect(404)

    const result = await TradeHistory.find({})
    expect(result).toHaveLength(2)
  })

  test("reject request where itemOwner is same as tradedWWith user", async () => {
    const newEntry = {
      item: itemIDs[2],
      tradedWith: userIDs[2]
    }

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[2]}`)
      .send(newEntry)
      .expect(400)

    const result = await TradeHistory.find({})
    expect(result).toHaveLength(2)
  })

  test("reject request with non existent item", async () => {
    const newEntry = {
      item: await itemHelper.nonExistentItemID(),
      tradedWith: userIDs[0]
    }

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[2]}`)
      .send(newEntry)
      .expect(404)

    const result = await TradeHistory.find({})
    expect(result).toHaveLength(2)
  })

  test("reject request if the item's availability is false", async () => {
    const updatedObject = {
      ...thirdItem,
      availability: false
    }

    await api
      .put(`/api/items/${itemIDs[2]}`)
      .set("Authorization", `bearer ${tokens[2]}`)
      .send(updatedObject)
      .expect(200)

    const newEntry = {
      item: itemIDs[2],
      tradedWith: userIDs[0]
    }

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[2]}`)
      .send(newEntry)
      .expect(400)

    const result = await TradeHistory.find({})
    expect(result).toHaveLength(2)
  })

  test("reject request to mark item not owned by user as traded", async () => {
    const newEntry = {
      item: itemIDs[0],
      tradedWith: userIDs[0],
    }

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[2]}`)
      .send(newEntry)
      .expect(403)

    const result = await TradeHistory.find({})
    expect(result).toHaveLength(2)
  })

  test("reject request with missing fields", async () => {
    const newEntry = {
      item: itemIDs[2],
      tradedWith: userIDs[0]
    }

    const noItem = { ...newEntry }
    delete noItem.item

    const noUser = { ...newEntry }
    delete noUser.tradedWith

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[2]}`)
      .send(noItem)
      .expect(400)

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[2]}`)
      .send(noUser)
      .expect(400)

    const result = await TradeHistory.find({})
    expect(result).toHaveLength(2)
  })

  test("reject request without token", async () => {
    const newEntry = {
      item: itemIDs[2],
      tradedWith: userIDs[0],
    }

    await api
      .post("/api/tradehistory")
      .send(newEntry)
      .expect(401)

    const result = await TradeHistory.find({})
    expect(result).toHaveLength(2)
  })

  test("reject request with invalid tokens", async () => {
    const newEntry = {
      item: itemIDs[2],
      tradedWith: userIDs[0]
    }

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer ${tokens[2].substring(4)}`)
      .send(newEntry)
      .expect(401)

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer abc123`)
      .send(newEntry)
      .expect(401)

    await api
      .post("/api/tradehistory")
      .set("Authorization", `bearer @@@`)
      .send(newEntry)
      .expect(401)

    await api
      .post("/api/tradehistory")
      .set("Authorization", `basic ${tokens[0]}`)
      .send(newEntry)
      .expect(401)

    await api
      .post("/api/tradehistory")
      .set("Authorization", `${tokens[0]}`)
      .send(newEntry)
      .expect(401)

    const result = await TradeHistory.find({})
    expect(result).toHaveLength(2)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
