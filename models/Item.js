const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    barcode: { type: String, required: true, unique: true } // Barcode field
});

module.exports = mongoose.model('Item', itemSchema);
