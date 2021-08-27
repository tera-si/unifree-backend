const jwt = require("jsonwebtoken")
const morgan = require("morgan")
const logger = require("./logger")
const multer = require("multer")
const User = require("../models/user")

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === "ValidationError") {
    const index = error.message.lastIndexOf(":")
    return response.status(400).json({ error: error.message.substring(index + 2) })
  }
  else if (error.name === "CastError") {
    return response.status(400).json({ error: "unrecognized ID" })
  }
  else if (error.message === "Only jpg, jpeg, png, and gif files are accepted") {
    return response.status(400).json({ error: "Only jpg, jpeg, png, and gif files are accepted" })
  }
  else if (error.name === "JsonWebTokenError") {
    return response.status(401).json({ error: "invalid token" })
  }

  next(error)
}

const storageOptions = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/items/images/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname)
  }
})

const multerUpload = multer({
  storage: storageOptions,
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      cb(new Error("Only jpg, jpeg, png, and gif files are accepted"))
    }

    cb(null, true)
  }
}).array("item-images", 8)

const tokenExtractor = (request, response, next) => {
  const auth = request.get("Authorization")

  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    request.token = auth.substring(7)
  }

  next()
}

const userExtractor = async (request, response, next) => {
  const token = request.token

  if (!token) {
    return next()
  }

  const decoded = jwt.verify(token, process.env.SECRET_KEY)
  if (!decoded.id) {
    return next()
  }

  const matchedUser = await User.findById(decoded.id)
  if (!matchedUser) {
    return next()
  }

  request.user = matchedUser
  next()
}

const middlewares = {
  morgan,
  unknownEndpoint,
  errorHandler,
  multerUpload,
  tokenExtractor,
  userExtractor,
}

module.exports = middlewares
