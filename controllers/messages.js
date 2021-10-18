const jwt = require("jsonwebtoken")
const { Server } = require("socket.io")
const User = require("../models/user")
const Message = require("../models/message")
const logger = require("../utils/logger")

const setup = (httpServer) => {
  // to hold mappings of userId: socketId
  const connectedUsers = []

  /**
   * Find the index of the given userId in the connectedUsers[] array
   * @param userId: String
   * @returns the index, or -1 if not found
   */
  const _socketIndex = (userId) => {
    for (let i = 0; i < connectedUsers.length; i++) {
      const user = connectedUsers[i]
      if (Object.prototype.hasOwnProperty.call(user, `${userId}`)) {
        return i
      }
    }

    return -1
  }

  // io is the socket server itself. If you need to do routing (e.g. redirect
  // private message to the correct recipient), use it
  // socket is the individual connection (users), call it when you need to
  // perform actions on the individual users
  //! change the origin when in production
  const io = new Server(httpServer, {
    cors: {
      origin: `http://${process.env.FRONTEND_ADDRESS}:3000`
    },
  })

  // middleware to authenticate socket users
  io.use((socket, next) => {
    const auth = socket.handshake.auth

    if (!auth) {
      logger.error(`Error: socket ${socket.id} authentication not found`)
      socket._error("missing or invalid authentication")
      socket.disconnect()
      return next(new Error("missing or invalid authentication"))
    }

    let token = auth.token
    if (!token) {
      logger.error(`Error: token not found in socket ${socket.id} authentication`)
      socket._error("missing or invalid token")
      socket.disconnect()
      return next(new Error("missing or invalid token"))
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY)
    if (!decoded.id) {
      logger.error(`Error: user ID not found in socket ${socket.id} authentication`)
      socket._error("missing or invalid token")
      socket.disconnect()
      return next(new Error("missing or invalid token"))
    }

    User.findById(decoded.id)
      .then(matchedUser => {
        if (!matchedUser) {
          logger.error(`Error: no matching user in socket ${socket.id} authentication`)
          socket._error("missing or invalid authentication")
          socket.disconnect()
          return next(new Error("missing or invalid authentication"))
        }

        if (matchedUser.id !== auth.userId) {
          logger.error(`Error: socket ${socket.id} authentication and user profile does not match`)
          socket._error("missing or invalid authentication")
          socket.disconnect()
          return next(new Error("missing or invalid authentication"))
        }

        if (matchedUser.username !== auth.username) {
          logger.error(`Error: socket ${socket.id} authentication and user profile does not match`)
          socket._error("missing or invalid authentication")
          socket.disconnect()
          return next(new Error("missing or invalid authentication"))
        }
      })

    socket.userId = auth.userId
    socket.username = auth.username
    next()
  })

  // The `removeAllListeners()` are to prevent duplicate emits
  io.on("connection", (socket) => {
    logger.info(`Socket ${socket.id}-${socket.userId} has connected`)
    socket.removeAllListeners()

    // mapping the socket.id to userId
    const idMapping = {}
    idMapping[`${socket.userId}`] = socket.id
    let index = _socketIndex(socket.userId)
    if (index === -1) {
      connectedUsers.push(idMapping)
    }
    else {
      connectedUsers[index] = idMapping
    }

    //* fetch all old, stored message when the user first connect *//
    const promises = [
      Message.find({ sentFrom: socket.userId })
        .populate("sentFrom", { username: 1, _id: 1 })
        .populate("sentTo", { username: 1, _id: 1 })
        .exec(),
      Message.find({ sentTo: socket.userId })
        .populate("sentFrom", { username: 1, _id: 1 })
        .populate("sentTo", { username: 1, _id: 1 })
        .exec()
    ]

    Promise.all(promises)
      .then(results => {
        index = _socketIndex(socket.userId)
        io.to(connectedUsers[index][socket.userId]).emit("fetchAllMessages", {
          messages: results
        })
      })
    //* end of fetch all old messages *//

    //* Listen when a new private message was sent *//
    socket.on("privateMessage", (message) => {
      // Saving the message to database
      const newMessage = new Message({
        dateSent: new Date(),
        sentFrom: socket.userId,
        content: message.content,
        sentTo: message.to,
        readByReceiver: false,
        readBySender: true,
      })

      newMessage.save()
        .then((savedMessage) => {
          savedMessage
            .populate("sentFrom", { username: 1, _id: 1 })
            .populate("sentTo", { username: 1, _id: 1 })
            .execPopulate()
            .then((populatedMessage) => {
              index = _socketIndex(message.to)

              if (index !== -1) {
                io.to(connectedUsers[index][message.to]).emit("privateMessage", {
                  message: populatedMessage
                })
              }
            })
        })
    })

    //* Handle client's affirmation that message is read *//
    socket.on("markAsRead", (userId) => {
      Message.updateMany({ sentFrom: userId, sentTo: socket.userId }, { readByReceiver: true })
        .then(() => {})
    })

    //* Handle when socket disconnect *//
    socket.on("disconnect", () => {
      logger.info(`Socket ${socket.id}-${socket.userId} has disconnected`)
      socket.removeAllListeners()
    })
  })
}

module.exports = setup
