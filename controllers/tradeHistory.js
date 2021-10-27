const tradeHistoryRouter = require("express").Router()
const userExtractor = require("../utils/middlewares").userExtractor
const TradeHistory = require("../models/tradeHistory")
const Item = require("../models/item")
const User = require("../models/user")

tradeHistoryRouter.post("/", userExtractor, async (request, response) => {
  const user = request.user
  if (!user) {
    return response.status(401).json({ error: "missing or invalid token" })
  }

  const body = request.body

  if (!body.item) {
    return response.status(400).json({ error: "missing item data" })
  }

  if (!body.tradedWith) {
    return response.status(400).json({ error: "missing user data" })
  }

  if (JSON.stringify(body.tradedWith) === "-1") {
    return response.status(400).json({ error: "invalid user selected" })
  }

  if (JSON.stringify(user._id) === JSON.stringify(body.tradedWith)) {
    return response.status(400).json({ error: "item owner same as user traded with" })
  }

  const matchedItem = await Item.findById(body.item)
  if (!matchedItem) {
    return response.status(404).json({ error: "no such item" })
  }

  if (JSON.stringify(user._id) !== JSON.stringify(matchedItem.postedBy)) {
    return response.status(403).json({ error: "not authorized for this action" })
  }

  if (!matchedItem.availability) {
    return response.status(400).json({ error: "archived item" })
  }

  const matchedUser = await User.findById(body.tradedWith)
  if (!matchedUser) {
    return response.status(404).json({ error: "no such user" })
  }

  const newEntry = new TradeHistory({
    itemOwner: user._id,
    item: body.item,
    tradedWith: body.tradedWith,
    dateDelisted: new Date()
  })

  const result = await newEntry.save()
  return response.status(201).json(result)
})

tradeHistoryRouter.get("/", userExtractor, async (request, response) => {
  const user = request.user
  if (!user) {
    return response.status(401).json({ error: "missing or invalid token" })
  }

  const ownedByUser = await TradeHistory.find({ itemOwner: user._id })
    .populate("itemOwner", { username: 1, _id: 1 })
    .populate("tradedWith", { username: 1, _id: 1 })
    .populate("item", { name: 1, _id: 1 })
  const tradedWithUser = await TradeHistory.find({ tradedWith: user._id })
    .populate("itemOwner", { username: 1, _id: 1 })
    .populate("tradedWith", { username: 1, _id: 1 })
    .populate("item", { name: 1, _id: 1 })

  const allEntries = [].concat(ownedByUser).concat(tradedWithUser)

  return response.status(200).json(allEntries)
})

tradeHistoryRouter.get("/:id", userExtractor, async (request, response) => {
  const user = request.user
  if (!user) {
    return response.status(401).json({ error: "missing or invalid token" })
  }

  const matchedEntry = await TradeHistory.findById(request.params.id)
    .populate("itemOwner", { username: 1, _id: 1 })
    .populate("tradedWith", { username: 1, _id: 1 })
    .populate("item", { name: 1, _id: 1 })

  if (!matchedEntry) {
    return response.status(404).json({ error: "no such entry" })
  }

  if (
    JSON.stringify(user._id) !== JSON.stringify(matchedEntry.itemOwner._id) &&
    JSON.stringify(user._id) !== JSON.stringify(matchedEntry.tradedWith._id)
  ) {
    return response.status(403).json({ error: "not authorized for this action" })
  }

  return response.status(200).json(matchedEntry)
})

module.exports = tradeHistoryRouter
