const mongoose = require('mongoose')
const { Schema, model } = mongoose;

const songSchema = new mongoose.Schema({
  spotifyId: {
    type: String,
    length: [22, 'Spotify ID should be 22 characters long '],
    required: true
  },
  poster: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
})

songSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Song', songSchema)
