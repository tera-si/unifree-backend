const app = require("./app")
const { createServer } = require("http")
const envConfig = require("./utils/envConfig")
const logger = require("./utils/logger")
const messageSetup = require("./controllers/messages")

const httpServer = createServer(app)
messageSetup(httpServer)

httpServer.listen(envConfig.PORT)
logger.info(`uniFree server running on PORT ${envConfig.PORT}`)

// FIXME: Message schema change `newMessage` to `readBySender` and
// `readByReceiver`, both Boolean values
