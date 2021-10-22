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

  const matchedItem = await Item.findById(body.item)
  if (!matchedItem) {
    return response.status(404).json({ error: "no such item" })
  }

  if (JSON.stringify(user._id) !== JSON.stringify(matchedItem.postedBy)) {
    return response.status(403).json({ error: "not authorized for this action" })
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

module.exports = tradeHistoryRouter
