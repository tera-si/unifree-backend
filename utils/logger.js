const info = (...info) => {
  console.log(...info)
}

const error = (...error) => {
  console.error(...error)
}

const logger = {
  info,
  error
}

module.exports = logger
