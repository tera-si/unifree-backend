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

beforeAll(async () => {
  await User.deleteMany({})
  await Item.deleteMany({})

  for (let user of userHelper.initialUsers) {
    await api.post("/api/users").send(user)

    const response = await api.post("/api/login").send(user)
    tokens.push(response.body.token)
    userIDs.push(response.body.id)
  }

  const thirdUser = {
    username: "third_username",
    password: "third_password",
    items: []
  }

  await api.post("/api/users").send(thirdUser)
  const response = await api.post("/api/login").send(thirdUser)
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

afterAll(() => {
  mongoose.connection.close()
})
