const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "username is required"],
    unique: true,
    minLength: [8, "username must be at least 8 characters long"]
  },
  password: {
    type: String,
    required: [true, "password is required"]
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item"
  }]
})

userSchema.set("toJSON", {
  transform: (document, returned) => {
    returned.id = returned._id.toString()
    delete returned._id
    delete returned.__v
    delete returned.password
  }
})

userSchema.plugin(
  uniqueValidator,
  { message: `{PATH} already taken` }
)

const User = mongoose.model("User", userSchema)
module.exports = User
