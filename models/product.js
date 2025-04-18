const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true }, // e.g., "Makeup", "Skincare"
    subscription: {type: Boolean, default: false},
    brand: { type: String },
    tags: { type: [String] }, // Tags related to quiz answers
    rating: { type: Number, default: 0 },
    reviews: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: String,
        rating: Number
    }],
    variations: [{ 
        shade: { type: String, required: false },
        price: { type: Number, required: true }, // Shades might have different prices
        stock: { type: Number, default: 0 }, // Stock per shade
        images: { type: [String], required: true } // Image specific to the shade
    }]
});

module.exports = mongoose.model('Product', productSchema);