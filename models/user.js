const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minLength: 8
  },
  password: {
    type: String,
    required: true
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

userSchema.plugin(uniqueValidator)

const User = mongoose.model("User", userSchema)
module.exports = User
