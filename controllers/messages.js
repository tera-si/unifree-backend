const jwt = require("jsonwebtoken")
const { Server } = require("socket.io")
const User = require("../models/user")
const Message = require("../models/message")
const logger = require("../utils/logger")

const setup = (httpServer) => {
  // to hold mappings of socket.id: userID
  const connectedUsers = []

  /**
   * Find the index of the given userId in the connectedUsers[] array
   * @param userId: String
   * @returns the index, or -1 if not found
   */
  const _socketIndex = (userId) => {
    let index = -1

    for (let i = 0; i < connectedUsers.length; i++) {
      const user = connectedUsers[i]
      if (Object.prototype.hasOwnProperty.call(user, `${userId}`)) {
        index = i
      }
    }

    return index
  }

  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000"
    },
  })

  // middleware to authenticate socket users
  io.use((socket, next) => {
    const auth = socket.handshake.auth

    if (!auth) {
      return next(new Error("missing or invalid authentication"))
    }

    let token = auth.token
    if (!token) {
      return next(new Error("missing or invalid token"))
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY)
    if (!decoded.id) {
      return next(new Error("missing or invalid token"))
    }

    User.findById(decoded.id)
      .then(matchedUser => {
        if (!matchedUser) {
          return next(new Error("missing or invalid authentication"))
        }

        if (matchedUser._id !== auth.userId) {
          return next(new Error("missing or invalid authentication"))
        }

        if (matchedUser.username !== auth.username) {
          return next(new Error("missing or invalid authentication"))
        }
      })

    socket.userId = auth.userId
    socket.username = auth.username
    next()
  })

  io.on("connection", (socket) => {
    logger.info(`Socket ${socket.id}-${socket.userId} has connected`)

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

    //? populate ?//
    //* fetch all old, stored message when the user first connect *//
    const promises = [
      Message.find({ sentFrom: socket.userId }).exec(),
      Message.find({ sentTo: socket.userId }).exec()
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
    socket.on("private message", (message) => {
      // Saving the message to database
      const newMessage = new Message({
        dateSent: new Date(),
        sentFrom: socket.userId,
        content: message.content,
        sentTo: message.to,
        newMessage: true
      })

      newMessage.save()
        .then(() => {
          // Then sent the message to the correct recipient
          io.to(message.to).emit("private message", {
            content: message.content,
            to: message.to
          })
        })
    })

    //? disconnect user ?//
  })
}

module.exports = setup
