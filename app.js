const envConfig = require("./utils/envConfig")
const express = require("express")
require("express-async-errors")
const app = express()
const cors = require("cors")
const mongoose = require("mongoose")
const logger = require("./utils/logger")
const middlewares = require("./utils/middlewares")
const usersRouter = require("./controllers/users")

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
app.use(express.json())
app.use(middlewares.morgan("tiny"))
app.use(middlewares.tokenExtractor)

app.use("/api/users", usersRouter)

app.use(middlewares.unknownEndpoint)
app.use(middlewares.errorHandler)

module.exports = app
