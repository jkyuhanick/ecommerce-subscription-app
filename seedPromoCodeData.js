const mongoose = require('mongoose');
const PromoCode = require('./models/promoCode');
const Product = require('./models/product');
require('dotenv').config(); 

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

const seedPromoCodeData = async () => {
    try {
        // Delete existing promo codes
        await PromoCode.deleteMany();

        const promoCodes = [
            {
                code: 'NEW10',
                discountType: 'percentage',
                discountValue: 10,
                expiryDate: new Date('2025-12-31'),
                maxUses: 1,
                usersUsed: [],
                validProducts: [] // This will apply to all products
            },
            {
                code: 'SAVE20',
                discountType: 'percentage',
                discountValue: 20,
                expiryDate: new Date('2025-12-31'),
                maxUses: 1000000000,
                usersUsed: [],
                validProducts: [] // This will apply to all products
            },
            {
                code: 'SPRING5OFF',
                discountType: 'fixed',
                discountValue: 5,
                expiryDate: new Date('2025-06-1'),
                maxUses: 1000000000,
                usersUsed: [],
                validProducts: [] // This will apply to all products
            },
            {
                code: 'NEWYEAR25',
                discountType: 'percentage',
                discountValue: 15,
                expiryDate: new Date('2025-01-01'),
                maxUses: 20,
                usersUsed: [],
                validProducts: [] // This will apply to all products
            }
        ];

        // Insert promo codes into the database
        await PromoCode.insertMany(promoCodes);
        console.log('Promo code data saved successfully!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error saving promo code data:', error);
        mongoose.connection.close();
    }
};

// Run the script
connectDB().then(seedPromoCodeData);

