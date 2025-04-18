const mongoose = require('mongoose');

const userBoxSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    selectedProducts: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        selectedVariation: {
            shade: String,
            images: [String]
        }
    }], 
    finalChoiceOptions: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        selectedVariation: {
            shade: String,
            images: [String]
        }
    }],
    finalChoice: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        selectedVariation: {
            shade: String,
            images: [String]
        }
    }, 
    month: { type: Number, required: true },
    year: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('UserBox', userBoxSchema);