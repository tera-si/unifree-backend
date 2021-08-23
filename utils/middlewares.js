const jwt = require("jsonwebtoken")
const morgan = require("morgan")
const logger = require("./logger")
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
    return response.status(404).json({ error: "unrecognized ID" })
  }

  next(error)
}

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
  tokenExtractor,
  userExtractor,
}

module.exports = middlewares
