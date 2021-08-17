const itemsRouter = require("express").Router()
const multer = require("multer")

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

itemsRouter.post("/", upload, async (request, response) => {
  // TODO: remove this console.log
  // console.log(request.body["item-name"])

  return response.status(201).send(request.file)
})

module.exports = itemsRouter
