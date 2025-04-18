const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Cart = require('../models/cart');
const Order = require('../models/order');
const Product = require('../models/product');
const PromoCode = require('../models/promoCode');
const Subscription = require('../models/subscription');

// Stripe payment (simulated)
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


// Middleware to check if the user is logged in
function ensureLoggedIn(req, res, next) {
    if (req.session.user) {
        return next(); // User is logged in, proceed
    }

    // Only set redirect URL if it's a normal page request (not an AJAX call)
    if (!req.xhr) {
        req.session.redirectUrl = req.originalUrl;
    }

    res.redirect('/login');
}

function calculateTotal(cart) {
    let total = 0;
    let message = '';

    // Ensure cart.items is an array
    if (!cart || !Array.isArray(cart.items)) {
        message = 'Cart items are not valid.';
        console.error('Cart items are not valid:', cart.items);
        return { total, message };
    }

    // Calculate the total price for all items in the cart
    cart.items.forEach(item => {
        const product = item.productId;

        // Ensure product exists and has variations
        if (!product || !product.variations || !Array.isArray(product.variations) || product.variations.length === 0) {
            console.error(`Product ${product?._id} has no valid variations.`);
            return; // Skip item if variations are missing
        }

        const variation = product.variations.find(v => v._id.toString() === item.variationId.toString());

        if (!variation) {
            console.error(`No matching variation found for product ${product._id} with variationId ${item.variationId}`);
            return; // Skip item if no matching variation
        }

        const price = variation.price; // Use the variation price

        // Add item price to total
        total += price * item.quantity;
    });

    // Apply promo code discount if available
    if (cart.promoCode) {
        const promo = cart.promoCode;

        // Check if the promo code is expired
        if (new Date() > promo.expiryDate) {
            console.log('Promo code has expired');
            message = 'Promo code has expired.';
            return { total, message };
        }

        // Check if the promo code is valid for the products in the cart
        let isValidPromo = true;

        // Ensure promo.validProducts is defined and is an array
        if (promo.validProducts && Array.isArray(promo.validProducts) && promo.validProducts.length > 0) {
            cart.items.forEach(item => {
                if (!promo.validProducts.includes(item.productId.toString())) {
                    isValidPromo = false;
                }
            });
        }

        if (!isValidPromo) {
            console.log('Promo code is not valid for all cart items');
            message = 'Promo code is not valid for the items in your cart.';
            return { total, message };
        }

        // Apply discount based on the promo code type
        let discountAmount = 0;

        if (promo.discountType === 'percentage') {
            discountAmount = (total * promo.discountValue) / 100;
        } else if (promo.discountType === 'fixed') {
            discountAmount = promo.discountValue;
        }

        // Subtract the discount from the total
        total -= discountAmount;
        console.log(`Promo code applied: Discount = ${discountAmount}, New Total = ${total}`);
    }

    // Ensure the total is always a number (default to 0 if it's not a valid number)
    total = isNaN(total) || total === null ? 0 : total;
    total = parseFloat(total).toFixed(2);

    return { total, message };
}

router.get('/', ensureLoggedIn, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const cart = await Cart.findOne({ userId }).populate('items.productId').populate('promoCode');
        const user = await User.findById(userId);

        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart');
        }

        // Use the total from the cart page
        let { total, message } = calculateTotal(cart);

        res.render('checkout', { cart, total, user });
    } catch (error) {
        console.error("Error loading checkout:", error);
        res.status(500).send("Error loading checkout.");
    }
});


router.post('/submit', ensureLoggedIn, async (req, res) => {
    try {
        let { fullName, address, total, paymentMethodId } = req.body;  // paymentMethodId is passed from frontend
        const userId = req.session.user.id;

        const { street, city, state, postalCode, country } = address;

        // Fetch user's cart and apply promo code discount
        const cart = await Cart.findOne({ userId }).populate('items.productId').populate('promoCode');

        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart');
        }

        // Calculate total from the cart, including promo code if available
        let { total: calculatedTotal, message } = calculateTotal(cart);

        if (parseFloat(total).toFixed(2) !== calculatedTotal) {
            return res.status(400).send('Total mismatch, please try again.');
        }

        // Charge the payment
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculatedTotal * 100,  // Amount in cents
            currency: 'usd',
            payment_method_data: {
                type: 'card',
                card: {
                    token: paymentMethodId,  // The token received from frontend
                },
            },
            confirm: true,
            return_url: 'https://localhost:5001/checkout/success'
        });

        const items = await Promise.all(cart.items.map(async (item) => {
            // Fetch the product using its productId
            const product = await Product.findById(item.productId).exec();
        
            // Ensure the product exists and has variations
            if (!product || !product.variations || product.variations.length === 0) {
                console.error(`Product ${product?._id} has no valid variations.`);
                throw new Error(`Product ${product?._id} has no valid variations.`);
            }
        
            // Find the correct variation based on the variationId
            const variation = product.variations.find(v => v._id.toString() === item.variationId.toString());
        
            if (!variation) {
                console.error(`No matching variation found for product ${product._id} with variationId ${item.variationId}`);
                throw new Error(`No matching variation found.`);
            }
        
            // Return the item with the price from the correct variation
            return {
                productId: product._id,
                variationId: item.variationId,
                name: product.name,
                quantity: item.quantity,
                price: variation.price, // Access price of the selected variation
            };
        }));

        total = parseFloat(parseFloat(total).toFixed(2));
        
        // Create the order with the calculated total
        const order = new Order({
            userId,
            items, // Items array with price included
            total, // Total price of the order
            shippingAddress: {
                fullName: fullName,
                address: street,  
                city: city,
                state: state,
                zip: postalCode, 
                country
            },
            status: 'Processing', // Default order status
            createdAt: new Date(),
        });
        
        await order.save();

        // Handle subscription creation if user purchased a subscription product
        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (product && product.subscription) {
                // Determine frequency and duration based on product name or another property
                let frequency = 'monthly';
                let duration = 1;

                if (product.name.toLowerCase().includes('3-month')) {
                    frequency = 'quarterly';
                    duration = 3;
                } else if (product.name.toLowerCase().includes('12-month') || product.name.toLowerCase().includes('1 year')) {
                    frequency = 'yearly';
                    duration = 12;
                }

                const startDate = new Date();
                const nextBillDate = new Date(startDate);

                // Set the nextBillDate based on duration
                if (frequency === 'monthly') nextBillDate.setMonth(nextBillDate.getMonth() + 1);
                else if (frequency === 'quarterly') nextBillDate.setMonth(nextBillDate.getMonth() + 3);
                else if (frequency === 'yearly') nextBillDate.setFullYear(nextBillDate.getFullYear() + 1);

                const subscription = new Subscription({
                    userId,
                    productId: item.productId,
                    variationId: item.variationId,
                    startDate,
                    nextBillDate,
                    frequency,
                    autoRenew: true,
                });

                await subscription.save();
            }
        }


        // Update stock levels
        for (const item of cart.items) {
            await Product.updateOne(
                { _id: item.productId._id, 'variations._id': item.variationId },
                { $inc: { 'variations.$.stock': -item.quantity } }
            );
        }

        // update promocode usage
        if (cart.promoCode) {
            const promoCode = await PromoCode.findById(cart.promoCode._id);
        
            if (promoCode) {
                const existingUserUsage = promoCode.usersUsed.find(entry => entry.userId.toString() === userId);
        
                if (existingUserUsage) {
                    existingUserUsage.usageCount += 1;
                } else {
                    promoCode.usersUsed.push({ userId, usageCount: 1 });
                }
        
                await promoCode.save();
            }
        }        

        // Clear cart
        cart.items = [];
        await cart.save();

        res.redirect('/checkout/success');  // Redirect after successful payment
    } catch (error) {
        console.error("Error processing checkout:", error);
        res.status(500).send("Checkout failed.");
    }
});


router.get('/success', ensureLoggedIn, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await User.findById(userId);

        // Fetch the latest order for the user
        const order = await Order.findOne({ userId }).sort({ createdAt: -1 }).populate('items.productId');

        if (!order) {
            return res.redirect('/');
        }
        res.render('checkout-success', {
            user,
            order
        });
    } catch (error) {
        console.error("Error loading checkout success page:", error);
        res.status(500).send("Error loading order confirmation.");
    }
});


module.exports = router;