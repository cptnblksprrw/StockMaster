const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({ 
    manufacturer: { type: String, required: true },
    colour : { type: String, required: true },
    style: { type: String, required: true },
    name: String,
    measurement1: { type: Number, required: true },
    unit1: { type: String, default: "Units" },
    measurement2: { type: String, required: false },
    unit2:{ type: String, default: "Units" },
    category: { type: String, required: true },
    description: { type: String, required: false },
    price: { type: Number, required: true },
    barcode: { type: String, required: true, unique: true }, // Barcode field
    image: { type: String, default: null },
    availability: {
        type: String,
        enum: ['in stock', 'sold'],
        default: 'in stock'
    },
   

    //template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' }, // template reference
},  { timestamps: true });

itemSchema.pre('save', function (next) {
    this.name = `${this.manufacturer || ''} ${this.style || ''} ${this.colour || ''}`.trim();
    next();
});

module.exports = mongoose.model('Item', itemSchema);
