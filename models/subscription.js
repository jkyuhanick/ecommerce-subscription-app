const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variationId: { type: mongoose.Schema.Types.ObjectId, required: true },

    startDate: { type: Date, required: true, default: Date.now },
    nextBillDate: { type: Date, required: true }, // auto-calculate from startDate + duration

    active: { type: Boolean, default: true }, // set to false if canceled

    frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        required: true,
    },
    
    autoRenew: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);