const bcrypt = require("bcrypt")
const usersRouter = require("express").Router()
const logger = require("../utils/logger")
const User = require("../models/user")

usersRouter.post("/", async (request, response) => {
  const body = request.body

  if (!body.password || body.password.length < 8) {
    logger.error("Error: Password too short")
    return response
      .status(400)
      .json({ error: "Password must be at least 8 characters long" })
  }

  if (body.password === body.username) {
    logger.error("Error: Password same as username")
    return response
      .status(400)
      .json({ error: "Password must not be the same as username" })
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
  const users = await User.find({})
  response.json(users)
})

usersRouter.get("/:id", async (request, response) => {
  const matchedUser = await User.findById(request.params.id)

  if (matchedUser) {
    response.status(200).json(matchedUser)
  }
  else {
    response.status(404).end()
  }
})

usersRouter.delete("/:id", async (request, response) => {
  await User.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

module.exports = usersRouter
