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
const tradeHistoryRouter = require("./controllers/tradeHistory")

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
app.use(middlewares.morgan("combined"))
app.use(middlewares.tokenExtractor)

app.use("/api/users", usersRouter)
app.use("/api/login", loginRouter)
app.use("/api/items", itemsRouter)
app.use("/api/tradehistory", tradeHistoryRouter)

app.use(middlewares.unknownEndpoint)
app.use(middlewares.errorHandler)

module.exports = app
