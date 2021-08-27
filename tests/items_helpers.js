const Item = require("../models/item")

const initialItems = [
  {
    name: "Rubber Pink Slippers",
    category: "Camera",
    condition: "Mostly new, rarely used",
    shipping: false,
    meet: true,
    description: "Only wore once. Don't like the feel of rubber under my feet.",
    imagePaths: [
      "pink-slippers-pexels-cottonbro-5874855.jpg",
      "pink-slippers-pexels-ron-lach-7825422.jpg"
    ],
    datePosted: new Date()
  },
  {
    name: "2021 Schedule Book",
    category: "Stationary",
    condition: "New",
    shipping: true,
    meet: false,
    description: "Brand new, I only took a look by flipping thru it",
    imagePaths: [
      "schedule-book-pexels-olya-kobruseva-5417666.jpg"
    ],
    datePosted: new Date()
  }
]

const allItemsFromDB = async () => {
  const items = await Item.find({})
  return items.map(item => item.toJSON())
}

const nonExistentItemID = async () => {
  const newItem = new Item({
    name: "will_be_deleted",
    category: "Camera",
    condition: "New",
    shipping: false,
    meet: false,
    description: "will_be_deleted",
    imagePaths: [
      "will_be_deleted.png"
    ],
    datePosted: new Date()
  })

  await newItem.save()
  await newItem.remove()

  return newItem.id.toString()
}

const itemsHelper = {
  initialItems,
  allItemsFromDB,
  nonExistentItemID
}

module.exports = itemsHelper
