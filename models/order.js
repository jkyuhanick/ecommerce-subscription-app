const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        price: Number,
        quantity: Number,
        variationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variation', default: null }
    }],
    total: { type: Number, required: true },
    shippingAddress: {
        fullName: String,
        address: String,
        city: String,
        state: String,
        zip: String
    },
    status: { type: String, enum: ["Processing", "Shipped", "Delivered"], default: "Processing" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('order', orderSchema);