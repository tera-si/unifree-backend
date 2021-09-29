const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  dateSent: {
    type: Date,
    required: true
  },
  sentFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  content: {
    type: String,
    required: [true, "message content is required"]
  },
  sentTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  newMessage: {
    type: Boolean,
    required: [true, "message status is required"]
  }
})

messageSchema.set("toJSON", {
  transform: (document, returned) => {
    returned.id = returned._id.toString()
    delete returned._id
    delete returned.__v
  }
})

module.exports = mongoose.model("Message", messageSchema)
