const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    maxUses: {
        type: Number, // max uses for code
        required: true
    },
    usersUsed: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            usageCount: { type: Number, default: 0 } // How many times the user has used this promo code
        }
    ],
    validProducts: {
        type: [mongoose.Schema.Types.ObjectId], // Array of product IDs that the promo code applies to
        default: [] // If empty, applies to all products
    }
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);