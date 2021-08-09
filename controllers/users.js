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

module.exports = usersRouter
