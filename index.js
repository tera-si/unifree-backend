const app = require("./app")
const envConfig = require("./utils/envConfig")
const logger = require("./utils/logger")

// TODO: use both http and https

app.listen(envConfig.PORT, () => {
  logger.info(`uniFree server running on PORT ${envConfig.PORT}`)
})
