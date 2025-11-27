const express = require('express')
const cors = require('cors')
const { info, error } = require('./utils/logger')
const songRouter = require('./routes/song')
const groupRouter = require('./routes/group')
const mongoose = require('mongoose')
const config = require('./utils/config')
const middleware = require('./utils/middleware')
const path = require('path') // added


const app = express()
mongoose.set('strictQuery', false)

info('Connecting to ', config.MONGODB_URI)
mongoose.connect(config.MONGODB_URI)
        .then( () => { info('Connected to MongoDB') })
        .catch( error => { error('Error connecting to MongoDB:', error(error)) 
        })

app.use(cors())
app.use(express.json())
//app.use(express.static('dist'))
app.use(express.static(path.join(__dirname, 'dist'))) // use absolute path


app.use(middleware.requestLogger)

app.use('/spotifysharer/song', songRouter)
app.use('/spotifysharer/group', groupRouter)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)


app.listen(config.PORT, () => {
  info(`Server running on port ${config.PORT}`)
})

//module.exports = app