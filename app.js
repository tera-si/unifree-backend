const envConfig = require("./utils/envConfig")
const express = require("express")
require("express-async-errors")
const app = express()
const cors = require("cors")
const mongoose = require("mongoose")
const logger = require("./utils/logger")

logger.info(`Connecting to MongoDB @ ${envConfig.MONGODB_URI}`)

const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}
mongoose
  .connect(envConfig.MONGODB_URI, connectionOptions)
  .then(() => {
    logger.info("Connection to MongoDB successful")
  })
  .catch(e => logger.error(`Error: Cannot connect to MongoDB\n${e.message}`))

app.use(cors())
app.use(express.json)

module.exports = app
