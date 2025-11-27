const mongoose = require('mongoose');
const { Schema } = mongoose;

const groupSchema = new Schema({
  name: {
    type: String,
    minlength: [5, 'Group name must be at least 5 characters long'],
    maxlength: [20, 'Group name can be up to 20 characters long'],
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

// --- Middleware: pre deleteOne sobre documento ---
groupSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const groupId = this._id;
  try {
    const users = await mongoose.model('User').find({ group: groupId });
    const userIds = users.map(u => u._id);

    await mongoose.model('Song').deleteMany({ poster: { $in: userIds } });
    await mongoose.model('User').deleteMany({ group: groupId });

    next();
  } catch (err) {
    next(err);
  }
});

// --- Middleware: post findOneAndDelete sobre query ---
groupSchema.post('findOneAndDelete', async function(doc) {
  if (!doc) return;
  const groupId = doc._id;
  const users = await mongoose.model('User').find({ group: groupId });
  const userIds = users.map(u => u._id);

  await mongoose.model('Song').deleteMany({ poster: { $in: userIds } });
  await mongoose.model('User').deleteMany({ group: groupId });
});

// --- Exportar modelo ---
const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
