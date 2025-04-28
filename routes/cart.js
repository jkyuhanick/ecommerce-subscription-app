const express = require('express');
const Cart = require('../models/cart');
const Product = require('../models/product'); 
const PromoCode = require('../models/promoCode')
const router = express.Router();

// Middleware to check if the user is logged in
function ensureLoggedIn(req, res, next) {
    if (req.session.user) {
        return next(); // User is logged in, proceed
    }

    // Only set redirect URL if it's a normal page request not an AJAX call
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
        if (promo.validProducts.length > 0) {
            cart.items.forEach(item => {
                if (!promo.validProducts.includes(item.productId.toString())) {
                    isValidPromo = false;
                }
            });
        }

        // If the promo is not valid for any items, return total without discount
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
    total = parseFloat(total);

    return { total, message };
}




// Display the cart (only for logged-in users)
router.get('/', ensureLoggedIn, async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Fetch the cart and populate the product details (including variations)
        const cart = await Cart.findOne({ userId })
            .populate('items.productId')   
            .populate('items.variationId') 
            .populate('promoCode')         
            .exec();

        if (cart) {
            // Use the calculateTotal function to get the total and message
            let { total, message } = calculateTotal(cart);

            // Ensure the total is a valid number before rendering
            const totalFormatted = !isNaN(total) ? total = parseFloat(total).toFixed(2) : '0.00';

            // Render the cart with the updated total and message
            res.render('cart', { cart, total: totalFormatted, message });

        } else {
            res.render('cart', { cart: { items: [] }, total: 0 });
        }
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).send('Error fetching cart');
    }
});




// Add item to cart (for both subscriptions & normal products)
router.post('/add/:productId', ensureLoggedIn, async (req, res) => {
    const userId = req.session.user.id;
    const { productId } = req.params;
    const { quantity, variationId } = req.body;  

    try {
        // Find the product by ID
        let product = await Product.findById(productId);

        if (!product) {
            console.log(`Product with ID ${productId} not found`);
            return res.status(404).send('Product not found');
        }

        // Handle subscription products ---- one variation
        if (product.subscription) {
            const variation = product.variations[0]; 

            // Find or create the user's cart
            let cart = await Cart.findOne({ userId });
            if (!cart) {
                cart = new Cart({ userId, items: [] });
            }

            // Check if the subscription is already in the cart
            const existingItem = cart.items.find(item => item.productId.toString() === product._id.toString());
            if (existingItem) {
                existingItem.quantity += parseInt(quantity, 10) || 1;
            } else {
                cart.items.push({
                    productId: product._id,
                    quantity: parseInt(quantity, 10) || 1,
                    variationId: variation._id,  
                    price: variation.price,
                });
            }

            // Save the updated cart
            await cart.save();
            return res.redirect('/cart');
        }

        // Handle regular products with multiple variations
        if (product.variations && product.variations.length > 0) {
            // product has multiple variations, find the selected variation by its ID
            const variation = product.variations.find(v => v._id.toString() === variationId);

            if (!variation) {
                return res.status(400).send('Variation not found');
            }

            // Find or create the user's cart
            let cart = await Cart.findOne({ userId });
            if (!cart) {
                cart = new Cart({ userId, items: [] });
            }

            // Check if the product already exists in the cart ---- checking variation ID as well
            const existingItem = cart.items.find(item =>
                item.productId.toString() === product._id.toString() &&
                item.variationId.toString() === variation._id.toString()
            );

            if (existingItem) {
                existingItem.quantity += parseInt(quantity, 10) || 1;
            } else {
                cart.items.push({
                    productId: product._id,
                    quantity: parseInt(quantity, 10) || 1,
                    variationId: variation._id,
                    price: variation.price,
                });
            }

            // Save the updated cart
            await cart.save();
            return res.redirect('/cart');
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Handle a simple produc
        const existingItem = cart.items.find(item => item.productId.toString() === product._id.toString());
        if (existingItem) {
            existingItem.quantity += parseInt(quantity, 10) || 1;
        } else {
            cart.items.push({
                productId: product._id,
                quantity: parseInt(quantity, 10) || 1,
                price: product.price,  // Use the product price if no variation is selected
            });
        }

        // Save the updated cart
        await cart.save();
        res.redirect('/cart');

    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).send('Error adding item to cart');
    }
});



// Remove item from cart
router.post('/remove/:productId', ensureLoggedIn, async (req, res) => {
    const userId = req.session.user.id;
    const { productId } = req.params;
    const { variationId } = req.body; 

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        // If variationId is provided, remove the item with both productId and variationId
        if (variationId) {
            cart.items = cart.items.filter(item => 
                item.productId.toString() !== productId || item.variationId.toString() !== variationId.toString()
            );
        } else {
            // If variationId is not provided, remove the entire product (all variations)
            cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        }

        await cart.save();
        res.redirect('/cart');
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).send('Error removing item from cart');
    }
});


// Update cart item quantity
router.post('/update/:productId,:variationId', ensureLoggedIn, async (req, res) => {
    const userId = req.session.user.id;
    const { productId, variationId } = req.params;
    const { change } = req.body;

    try {
        const cart = await Cart.findOne({ userId }).populate('items.productId').populate('promoCode').exec();
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Find the item in the cart based on both productId and variationId
        const item = cart.items.find(item =>
            item.productId._id.toString() === productId && item.variationId.toString() === variationId
        );

        if (!item) {
            return res.status(404).json({ error: 'Item or variation not found in cart' });
        }

        // Update quantity
        item.quantity = Math.max(1, item.quantity + change);

        // Save the updated cart
        await cart.save();

        // Use your custom calculateTotal function to recalculate the total
        const { total } = calculateTotal(cart);

        // Recalculate total item count
        const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        
        res.json({ newQuantity: item.quantity, newTotal: total, cartCount });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Error updating cart' });
    }
});




router.get('/count', ensureLoggedIn, async (req, res) => {
    const userId = req.session.user.id;

    try {
        const cart = await Cart.findOne({ userId }).populate('items.productId').populate('items.variationId');
        
        // Ensure the cart exists
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Calculate the total quantity of items in the cart
        const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Return the total item count in the cart
        res.json({ cartCount });
    } catch (error) {
        console.error('Error fetching cart count:', error);
        res.status(500).json({ error: 'Error fetching cart count' });
    }
});


// Route to apply a promo code
router.post('/apply-promo', async (req, res) => {
    try {
        const { promoCode } = req.body; // Get the promo code entered by the user
        const userId = req.session.user.id;
        let message = '';
        let success = false;

        // Find the user's cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            message = 'Cart not found.';
            return res.status(404).json({ success, message });
        }

        // Find the promo code in the database
        const promo = await PromoCode.findOne({ code: promoCode });

        if (!promo) {
            message = 'Invalid promo code.';
            return res.status(400).json({ success, message });
        }

        // Check if promo code has expired
        if (new Date() > promo.expiryDate) {
            message = 'Promo code has expired.';
            return res.status(400).json({ success, message });
        }
        
        // Check if the user has already used this promo code max times
        const userUsage = promo.usersUsed.find(u => u.userId.toString() === userId);
        if (userUsage && userUsage.usageCount >= promo.maxUses) { 
            message = 'You have already used this promo code the maximum number of times.';
            return res.status(400).json({ success, message });
        }

        // Check if the promo code is applicable to the cart items
        let isValid = true;
        if (promo.validProducts.length > 0) {
            cart.items.forEach(item => {
                if (!promo.validProducts.includes(item.productId.toString())) {
                    isValid = false;
                }
            });
        }

        if (!isValid) {
            message = 'This promo code is not valid for the items in your cart.';
            return res.status(400).json({ success, message });
        }

        // Apply the promo code to the cart
        cart.promoCode = promo._id;


        // Save the updated cart and promo code
        await cart.save();
        await promo.save();

        cart = await Cart.findOne({ userId })
            .populate('items.productId')   
            .populate('items.variationId') 
            .populate('promoCode')         
            .exec();

        // calculate the total with the promo code applied
        const total = calculateTotal(cart);
        res.json({ success: true, message: 'Promo code applied successfully!', total: total.total, promoCode: {
            code: promo.code,
            discount: promo.discount
        } });
        

    } catch (error) {
        console.error('Error applying promo code:', error);
        res.status(500).json({ success: false, message: 'An error occurred while applying the promo code.' });
    }
});

// route to remove a promo code
router.post('/remove-promo', async (req, res) => {
    const userId = req.session.user.id;

    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Remove the promo code and save
        if (cart.promoCode) {
            cart.promoCode = null;
            await cart.save();
        }

        // Re-fetch the cart 
        cart = await Cart.findOne({ userId }).populate('items.productId'); 

        const total = calculateTotal(cart);

        res.json({ success: true, message: 'Promo code removed', total: total.total });

    } catch (err) {
        console.error('Error removing promo code:', err);
        res.status(500).json({
            success: false,
            message: 'An error occurred while removing the promo code.',
        });
    }
});



module.exports = router;