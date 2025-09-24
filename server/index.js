const express = require('express')
const cors = require('cors')
const app = express();
const router = require('./routes/router')
const cookieParser = require('cookie-parser');
const db = require('./config/db')

const corsOptions = {
  origin: ['http://localhost:3000'], // Replace with your allowed origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedhallowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allowed methods
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json())

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

app.use('/', router)

db().then(() => {

  app.listen(5001, () => {
    console.log('Server Connected');
  })
})

module.exports = app