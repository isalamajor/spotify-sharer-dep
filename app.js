const express = require('express')
const cors = require('cors')
const { info, error } = require('./utils/logger')
const songRouter = require('./routes/song')
const groupRouter = require('./routes/group')
const mongoose = require('mongoose')
const config = require('./utils/config')
const middleware = require('./utils/middleware')
const path = require('path')

const app = express()
mongoose.set('strictQuery', false)

info('Connecting to ', config.MONGODB_URI)
mongoose.connect(config.MONGODB_URI)
  .then(() => info('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err))

app.use(cors())
app.use(express.json())

// API ROUTES
app.use('/spotifysharer/song', songRouter)
app.use('/spotifysharer/group', groupRouter)

app.use(middleware.requestLogger)

// STATIC FILES (frontend)
app.use(express.static(path.join(__dirname, 'dist')))

// CATCH-ALL (SPA)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// 404 + ERROR MIDDLEWARES — MUST BE LAST
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
