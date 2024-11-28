const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema({
  manufacturer: { type: String, required: true },
  colour: { type: String, required: true },
  style: { type: String, required: true },
  name: String,
  measurement1: { type: Number, required: true },
  unit1: { type: String, default: "Units" },
  measurement2: { type: String, required: false },
  unit2: { type: String, default: "Units" },
  category: { type: String, required: true },
  description: { type: String, required: false },
  price: { type: Number, required: true },
  image: { type: String, default: null },
  itemCount: { type: Number, default: 0 }, // Tracks items created from this template
});

templateSchema.pre('save', function (next) {
    this.name = `${this.manufacturer || ''} ${this.style || ''} ${this.colour || ''}`.trim();
    next();
});

module.exports = mongoose.model("Template", templateSchema);
