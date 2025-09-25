require('dotenv').config();
const express = require('express')
const cors = require('cors')
const http = require('http')
const app = express();
const server = http.createServer(app)
const { Server } = require('socket.io')
const router = require('./routes/router')
const cookieParser = require('cookie-parser');
const db = require('./config/db')

const corsOptions = {
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json())

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

app.use('/', router)

db().then(() => {
  const io = new Server(server, {
    cors: {
      origin: corsOptions.origin,
      methods: corsOptions.methods,
      credentials: corsOptions.credentials
    }
  })

  io.on('connection', (socket) => {
    // Join room: expected { roomId, userId, userType }
    socket.on('join', ({ roomId }) => {
      if (!roomId) return
      socket.join(roomId)
      socket.to(roomId).emit('user:joined', { roomId, socketId: socket.id })
    })

    // Message: expected { roomId, message }
    socket.on('message', (payload) => {
      const { roomId, message } = payload || {}
      if (!roomId || !message) return
      io.to(roomId).emit('message', { ...message })
    })

    // Typing indicators
    socket.on('typing', ({ roomId, userId, isTyping }) => {
      if (!roomId) return
      socket.to(roomId).emit('typing', { roomId, userId, isTyping })
    })

    socket.on('disconnect', () => {
      // Optionally broadcast disconnect events per room
    })
  })

  server.listen(5001, () => {
    console.log('Server Connected: http://localhost:5001')
  })
})

module.exports = app