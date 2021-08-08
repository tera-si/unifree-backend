const bcrypt = require("bcrypt")
const usersRouter = require("express").Router()
const User = require("../models/user")

usersRouter.post("/", async (request, response) => {
  // const body = request.body
})

usersRouter.get("/", async (request, response) => {
  const users = await User.find({})
  response.json(users)
})

module.exports = usersRouter
