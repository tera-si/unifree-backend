const User = require("../models/user")

const initialUsers = [
  {
    "username": "first_username",
    "password": "first_password",
    "items": []
  },
  {
    "username": "second_username",
    "password": "second_password",
    "items": []
  }
]

const allUsersFromDB = async () => {
  const users = await User.find({})
  return users.map(user => user.toJSON())
}

const nonExistentUserID = async () => {
  const newUser = new User({
    "username": "will_be_deleted",
    "password": "will_be_deleted",
    items: []
  })

  await newUser.save()
  await newUser.remove()

  return newUser.id.toString()
}

const usersHelper = {
  initialUsers,
  allUsersFromDB,
  nonExistentUserID
}

module.exports = usersHelper
