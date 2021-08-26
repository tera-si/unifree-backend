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

// TODO: route for GET items and individual item
// TODO: change it so that no images will be uploaded if no token were provided
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

module.exports = itemsRouter
