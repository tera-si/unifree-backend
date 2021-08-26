const itemsRouter = require("express").Router()
const userExtractor = require("../utils/middlewares").userExtractor
const multerUpload = require("../utils/middlewares").multerUpload
const Item = require("../models/item")

//! Warning: this file has not yet been thru unit testing !//

itemsRouter.post("/", [multerUpload, userExtractor], async (request, response) => {
  const user = request.user
  if (!user) {
    return response.status(401).json({ error: "missing or invalid token" })
  }

  const imagePaths = []
  for (let file of request.files) {
    imagePaths.push(file.filename)
  }

  const item = new Item({
    name: request.body["item-name"],
    category: request.body["item-category"],
    condition: request.body["item-condition"],
    shipping: request.body["item-shipping"],
    meet: request.body["item-meet"],
    description: request.body["item-description"],
    imagePaths,
    datePosted: new Date(),
    postedBy: user._id
  })

  const result = await item.save()
  user.items = user.items.concat(result._id)
  await user.save()

  return response.status(201).json(result)
})

itemsRouter.get("/", async (request, response) => {
  const allItems = await Item.find({})
  response.json(allItems)
})

itemsRouter.get("/:id", async (request, response) => {
  const matchedItem = await Item.findById(request.params.id)

  if (matchedItem) {
    response.status(200).json(matchedItem)
  }
  else {
    response.status(404).end()
  }
})

itemsRouter.delete("/:id", userExtractor, async (request, response) => {
  const user = request.user
  if (!user) {
    return response.status(401).json({ error: "missing or invalid token" })
  }

  const matchedItem = await Item.findById(request.params.id)
  if (!matchedItem) {
    response.status(404).end()
  }

  if (matchedItem.postedBy !== user._id) {
    return response.status(403).json({ error: "not authorized for this action" })
  }

  await matchedItem.delete()
  response.status(204).end()
})

module.exports = itemsRouter
