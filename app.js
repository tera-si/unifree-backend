const envConfig = require("./utils/envConfig")
const express = require("express")
require("express-async-errors")
const app = express()
const cors = require("cors")
const mongoose = require("mongoose")
const logger = require("./utils/logger")
const middlewares = require("./utils/middlewares")
const usersRouter = require("./controllers/users")
const loginRouter = require("./controllers/login")
const itemsRouter = require("./controllers/items")

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
app.use(express.static("public"))
app.use(middlewares.morgan("tiny"))
app.use(middlewares.tokenExtractor)

// TODO: check if there are any other places that needs to use mongoose.populate
// TODO: also review the current populate() calls, and tests
app.use("/api/users", usersRouter)
app.use("/api/login", loginRouter)
app.use("/api/items", itemsRouter)

app.use(middlewares.unknownEndpoint)
app.use(middlewares.errorHandler)

module.exports = app
