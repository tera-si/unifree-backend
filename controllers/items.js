const itemsRouter = require("express").Router()
const multer = require("multer")
const userExtractor = require("../utils/middlewares").userExtractor

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

// TODO: handle post errors
// TODO: Item schema, and post item to MongoDB
// TODO: route for GET items and individual item
// TODO: change it so that no images will be uploaded if no token were provided
itemsRouter.post("/", [upload, userExtractor], async (request, response) => {
  // TODO: remove this console.log
  // console.log(request.body["item-name"])

  if (!request.user) {
    return response.status(401).json({ error: "missing or invalid token" })
  }

  return response.status(201).send(request.file)
})

module.exports = itemsRouter
