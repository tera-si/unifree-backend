const app = require("./app")
const envConfig = require("./utils/envConfig")
const logger = require("./utils/logger")

app.listen(
  envConfig.PORT,
  () => logger.info(`uniFree server running at localhost:${envConfig.PORT}`)
)
