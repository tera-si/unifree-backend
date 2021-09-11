const mongoose = require("mongoose")

const conditions = [
  "New",
  "New, box opened",
  "New, with defects",
  "Mostly new, rarely used",
  "Good",
  "Visible wear",
  "Damaged",
  "For parts"
]

const categories = [
  "Art/craft supply",
  "Bedroom Accessory",
  "Book",
  "Camera",
  "Clothing",
  "Computer/laptop",
  "Cosmetic/perfume",
  "Decorative/trinket",
  "Fashion accessory",
  "Furniture",
  "Gadget/consumer electronics",
  "Gardening",
  "Home appliance",
  "Kitchenware",
  "Music instrument",
  "Pet supply",
  "Phone",
  "Service",
  "Shoes",
  "Sporting",
  "Stationary",
  "Tablet",
  "Tableware",
  "Toddler/kid supply",
  "Toiletry",
  "Toy/Hobby",
  "Transportation",
  "Video game/console",
  "Other"
]

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "item name is required"],
  },
  category: {
    type: String,
    required: [true, "item category is required"],
    enum: {
      values: categories,
      message: "Invalid category received: {VALUE}",
    }
  },
  condition: {
    type: String,
    required: [true, "item condition is required"],
    enum: {
      values: conditions,
      message: "Invalid condition received: {VALUE}"
    }
  },
  shipping: {
    type: Boolean,
    required: [true, "exchange method (shipping) is required"],
  },
  meet: {
    type: Boolean,
    required: [true, "exchange method (meet) is required"],
  },
  description: {
    type: String,
    required: [true, "item description is required"],
  },
  imagePaths: {
    type: [String],
    required: [true, "paths item images are required"],
  },
  datePosted: {
    type: Date,
    required: true,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  availability: {
    type: Boolean,
    required: [true, "item availability is required"],
  },
})

itemSchema.set("toJSON", {
  transform: (document, returned) => {
    returned.id = returned._id.toString()
    delete returned._id
    delete returned.__v
  }
})

module.exports = mongoose.model("Item", itemSchema)
