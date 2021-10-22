const mongoose = require("mongoose")

const tradeHistorySchema = new mongoose.Schema({
  itemOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item"
  },
  tradedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  dateDelisted: {
    type: Date,
    required: true
  }
})

tradeHistorySchema.set("toJSON", {
  transform: (document, returned) => {
    returned.id = returned._id.toString()
    delete returned._id
    delete returned.__v
  }
})

module.exports = mongoose.model("TradeHistory", tradeHistorySchema)
