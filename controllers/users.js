const bcrypt = require("bcrypt")
const usersRouter = require("express").Router()
const logger = require("../utils/logger")
const User = require("../models/user")
const userExtractor = require("../utils/middlewares").userExtractor

const populateConfig = {
  _id: 1,
  name: 1,
  category: 1,
  condition: 1,
  imagePaths: 1,
  datePosted: 1,
  availability: 1,
}

usersRouter.post("/", async (request, response) => {
  const body = request.body

  if (!body.password || body.password.length < 8) {
    logger.error("Error: Password too short")
    return response
      .status(400)
      .json({ error: "password must be at least 8 characters long" })
  }

  if (body.password === body.username) {
    logger.error("Error: Password same as username")
    return response
      .status(400)
      .json({ error: "password must not be the same as username" })
  }

  const salt = 10
  const hashedPassword = await bcrypt.hash(body.password, salt)

  const newUser = new User({
    username: body.username,
    password: hashedPassword,
    items: body.items || []
  })

  const savedObj = await newUser.save()
  response.status(201).json(savedObj)
})

usersRouter.get("/", async (request, response) => {
  const users = await User.find({}).populate("items", populateConfig)
  response.json(users)
})

usersRouter.get("/:id", async (request, response) => {
  const matchedUser = await User.findById(request.params.id).populate("items", populateConfig)

  if (matchedUser) {
    response.status(200).json(matchedUser)
  }
  else {
    response.status(404).end()
  }
})

// TODO: 1. use userExtractor middleware
usersRouter.delete("/:id", async (request, response) => {
  await User.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

usersRouter.put("/:id", userExtractor, async (request, response) => {
  const user = request.user
  if (!user) {
    return response.status(401).json({ error: "missing or invalid token" })
  }

  const matchedUser = await User.findById(request.params.id)
  if (!matchedUser) {
    return response.status(404).end({ error: "no such user" })
  }

  if (JSON.stringify(matchedUser._id) !== JSON.stringify(user._id)) {
    return response.status(403).json({ error: "not authorized for this action" })
  }

  const body = request.body

  // User must provide their original password before they can change to a new one
  let checkPassword = await bcrypt.compare(body.oldPassword, matchedUser.password)
  if (!checkPassword) {
    return response.status(401).json({ error: "invalid original password" })
  }

  let updatedPassword = undefined
  checkPassword = await bcrypt.compare(body.password, matchedUser.password)

  // Meaning it's not the same password, aka updated
  if (!checkPassword) {
    // hashing the new password
    const salt = 10
    updatedPassword = await bcrypt.hash(body.password, salt)
  }
  else {
    // password hasn't change
    updatedPassword = matchedUser.password
  }

  const result = await User.findByIdAndUpdate(
    request.params.id,
    {
      username: body.username || matchedUser.username,
      password: updatedPassword,
      items: body.items || matchedUser.items,
    },
    {
      new: true,
      runValidators: true,
      context: "query"
    }
  )

  response.status(200).json(result)
})

module.exports = usersRouter
