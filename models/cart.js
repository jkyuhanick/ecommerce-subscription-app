const mongoose = require('mongoose');


const CartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        variationId: { type: mongoose.Schema.Types.ObjectId },
    }],
    promoCode: {type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode', required: false},
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Cart', CartSchema);