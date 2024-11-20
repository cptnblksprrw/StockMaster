const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }] // Array of item references
});

module.exports = mongoose.model('Group', groupSchema);
