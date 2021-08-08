require("dotenv").config()

const PORT = process.env.PORT

const MONGODB_URI = process.env.NODE_ENV === "dev"
  ? process.env.DEV_MONGODB_URI
  : process.env.MONGODB_URI

const envConfig = {
  PORT,
  MONGODB_URI
}

module.exports = envConfig
