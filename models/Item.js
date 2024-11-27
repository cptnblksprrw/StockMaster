const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    manufacturer: { type: String, required: true },
    colour : { type: String, required: false },
    style: { type: String, required: false },
    quantity: { type: Number, required: true },
    unit: { type: String, required: false },
    category: { type: String, required: true },
    description: { type: String, required: false },
    barcode: { type: String, required: true, unique: true }, // Barcode field
    image: { type: String, default: null },
});

module.exports = mongoose.model('Item', itemSchema);
