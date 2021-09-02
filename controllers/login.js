const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const loginRouter = require("express").Router()
const User = require("../models/user")

loginRouter.post("/", async (request, response) => {
  const body = request.body

  const matchedUser = await User.findOne({ username: body.username })
  if (!matchedUser) {
    return response.status(401).json({ error: "invalid username" })
  }

  const checkPassword = await bcrypt.compare(body.password, matchedUser.password)
  if (!checkPassword) {
    return response.status(401).json({ error: "incorrect password" })
  }

  const token = jwt.sign({
    username: matchedUser.username,
    id: matchedUser._id
  }, process.env.SECRET_KEY)

  response
    .status(200)
    .send({ token, username: matchedUser.username, id: matchedUser._id })
})

module.exports = loginRouter
