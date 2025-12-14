require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const router = require("./routes/router");
const cookieParser = require("cookie-parser");
const db = require("./config/db");
const { startAutoCompleteCron } = require("./utils/autoCompleteBookings");

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://mehndi-client.vercel.app",
    "http://localhost:5001",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cookieParser());
app.use(cors(corsOptions));
// Stripe webhook removed
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

app.use("/", router);

db().then(() => {
  server.listen(5001, () => {
    console.log("Server Connected: http://localhost:5001");
  });

  // Start auto-complete bookings cron job
  startAutoCompleteCron();
  const io = new Server(server, {
    cors: {
      origin: corsOptions.origin,
      methods: corsOptions.methods,
      credentials: corsOptions.credentials,
    },
  });

  // Simple in-memory presence tracking: userId -> Set of socketIds
  const userIdToSockets = new Map();

  io.on("connection", (socket) => {
    // Identify/presence online: expected { userId }
    socket.on("presence:online", ({ userId }) => {
      if (!userId) return;
      const set = userIdToSockets.get(String(userId)) || new Set();
      set.add(socket.id);
      userIdToSockets.set(String(userId), set);
      io.emit("presence:update", { userId: String(userId), isOnline: true });
    });

    // Join room: expected { roomId, userId, userType }
    socket.on("join", ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);
      socket.to(roomId).emit("user:joined", { roomId, socketId: socket.id });
    });

    // Message: expected { roomId, message }
    socket.on("message", (payload) => {
      const { roomId, message } = payload || {};
      if (!roomId || !message) return;
      io.to(roomId).emit("message", { ...message });
    });

    // Typing indicators
    socket.on("typing", ({ roomId, userId, isTyping }) => {
      if (!roomId) return;
      socket.to(roomId).emit("typing", { roomId, userId, isTyping });
    });

    socket.on("disconnect", () => {
      // Remove socket from any presence sets and broadcast offline if none remain
      for (const [userId, set] of userIdToSockets.entries()) {
        if (set.has(socket.id)) {
          set.delete(socket.id);
          if (set.size === 0) {
            userIdToSockets.delete(userId);
            io.emit("presence:update", { userId, isOnline: false });
          } else {
            userIdToSockets.set(userId, set);
          }
          break;
        }
      }
    });
  });
});

module.exports = app;
