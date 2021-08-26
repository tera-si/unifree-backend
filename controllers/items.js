const itemsRouter = require("express").Router()
const multer = require("multer")
const userExtractor = require("../utils/middlewares").userExtractor
const Item = require("../models/item")

const storageOptions = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/items/images/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname)
  }
})

const upload = multer({
  storage: storageOptions,
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      cb(new Error("Only jpg, jpeg, png, and gif files are accepted"))
    }

    cb(null, true)
  }
}).array("item-images", 8)

itemsRouter.post("/", [upload, userExtractor], async (request, response) => {
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

module.exports = itemsRouter
