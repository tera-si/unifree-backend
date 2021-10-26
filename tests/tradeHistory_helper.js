const TradeHistory = require("../models/tradeHistory")

const nonExistentHistoryID = async (ownerID, itemID, tradedWithID) => {
  const newEntry = new TradeHistory({
    itemOwner: ownerID,
    item: itemID,
    tradedWith: tradedWithID,
    dateDelisted: new Date()
  })

  await newEntry.save()
  await newEntry.remove()

  return newEntry.id.toString()
}

const tradeHistoryHelper = {
  nonExistentHistoryID,
}

module.exports = tradeHistoryHelper
