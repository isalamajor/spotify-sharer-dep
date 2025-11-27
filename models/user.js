const mongoose = require('mongoose')
const { Schema, model } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    maxlength: [15, 'Username can be up to 15 characters long '],
    minlength: [3, 'Username must be at least 4 characters long'],
    required: true
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: "group",
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
})

userSchema.index({ username: 1, group: 1 }, { unique: true })

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject.__v
  }
})

module.exports = model('User', userSchema)
