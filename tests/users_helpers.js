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

const usersHelper = {
  initialUsers,
  allUsersFromDB
}

module.exports = usersHelper
