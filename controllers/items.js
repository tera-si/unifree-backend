const itemsRouter = require("express").Router()
const userExtractor = require("../utils/middlewares").userExtractor
const multerUpload = require("../utils/middlewares").multerUpload
const Item = require("../models/item")

itemsRouter.post("/", [multerUpload, userExtractor], async (request, response) => {
  const user = request.user
  if (!user) {
    return response.status(401).json({ error: "missing or invalid token" })
  }

  if (!request.files || request.files.length <= 0) {
    return response.status(400).json({ error: "missing images of item" })
  }

  if (
    (!request.body["item-shipping"] || request.body["item-shipping"] === "false")
    &&
    (!request.body["item-meet"] || request.body["item-meet"] === "false")
  ) {
    return response.status(400).json({ error: "at least one exchange method must be checked" })
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
    postedBy: user._id,
    availability: true
  })

  const result = await item.save()
  user.items = user.items.concat(result._id)
  await user.save()

  return response.status(201).json(result)
})

itemsRouter.get("/", async (request, response) => {
  const allItems = await Item.find({ availability: true }).populate("postedBy", { username: 1, _id: 1 })
  response.json(allItems)
})

itemsRouter.get("/:id", async (request, response) => {
  const matchedItem = await Item.findById(request.params.id).populate("postedBy", { username: 1, _id: 1 })

  if (matchedItem) {
    response.status(200).json(matchedItem)
  }
  else {
    response.status(404).end()
  }
})

// TODO: not yet tested
//? delete associated pictures ?//
itemsRouter.delete("/:id", userExtractor, async (request, response) => {
  const user = request.user
  if (!user) {
    return response.status(401).json({ error: "missing or invalid token" })
  }

  const matchedItem = await Item.findById(request.params.id)
  if (!matchedItem) {
    response.status(404).json({ error: "no such item" })
  }

  if (matchedItem.postedBy !== user._id) {
    return response.status(403).json({ error: "not authorized for this action" })
  }

  await matchedItem.delete()
  response.status(204).end()
})

itemsRouter.put("/:id", userExtractor, async (request, response) => {
  const user = request.user
  if (!user) {
    return response.status(401).json({ error: "missing or invalid token" })
  }

  const matchedItem = await Item.findById(request.params.id)
  if (!matchedItem) {
    return response.status(404).json({ error: "no such item" })
  }

  if (JSON.stringify(user._id) !== JSON.stringify(matchedItem.postedBy)) {
    return response.status(403).json({ error: "not authorized for this action" })
  }

  let updatedAvailability = matchedItem.availability
  if (request.body["availability"] !== null && request.body["availability"] !== undefined) {
    updatedAvailability = request.body["availability"]
  }

  const updatedItem = {
    name: request.body["item-name"] || matchedItem.name,
    category: request.body["item-category"] || matchedItem.category,
    condition: request.body["item-condition"] || matchedItem.condition,
    shipping: request.body["item-shipping"] || matchedItem.shipping,
    meet: request.body["item-meet"] || matchedItem.meet,
    description: request.body["item-description"] || matchedItem.description,
    imagePaths: request.body["imagePaths"] || matchedItem.imagePaths,
    datePosted: matchedItem.datePosted,
    postedBy: matchedItem.postedBy,
    availability: updatedAvailability,
  }

  if (!updatedItem.shipping && !updatedItem.meet) {
    return response.status(400).json({ error: "at least one exchange method must be checked" })
  }

  const result = await Item.findByIdAndUpdate(
    request.params.id,
    updatedItem,
    {
      new: true,
      runValidators: true,
      context: "query"
    }
  )

  response.status(200).json(result)
})

module.exports = itemsRouter
