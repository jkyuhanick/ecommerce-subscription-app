const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Route to display all products + filters + sort by
router.get('/', async (req, res) => {
    try {
        const { sort, category, brand } = req.query;

        // Normalize filter values to arrays
        const selectedCategories = Array.isArray(category) ? category : category ? [category] : [];
        const selectedBrands = Array.isArray(brand) ? brand : brand ? [brand] : [];

        // filter object
        const filter = {};
        if (selectedCategories.length) {
            filter.category = { $in: selectedCategories };
        }
        if (selectedBrands.length) {
            filter.brand = { $in: selectedBrands };
        }

        let products = await Product.find(filter);

        // Sort by price
        if (sort === 'low' || sort === 'high') {
            products = products.sort((a, b) => {
                const aPrice = a.variations[0]?.price || 0;
                const bPrice = b.variations[0]?.price || 0;
                return sort === 'low' ? aPrice - bPrice : bPrice - aPrice;
            });
        }

        // Relevance / Default
        if (sort === 'relevance' || !sort) {
            products.sort((a, b) => (a.subscription === b.subscription ? 0 : a.subscription ? -1 : 1));
        }

        // sort by popular

        // Get unique categories/brands for filters
        const categories = await Product.distinct('category');
        const brands = await Product.distinct('brand');

        // Products render
        res.render('products', {
            products,
            categories,
            brands,
            selectedSort: sort || 'relevance',
            selectedCategories,
            selectedBrands
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error loading products.');
    }
});


// Redirects user to previous page after loggin in
router.get('/products-protected-route', (req, res) => {
    if (!req.session.user) {
        const redirectUrl = req.headers.referer || '/products'; // Default to products page
        console.log('User not logged in, setting redirect URL:', redirectUrl);
        req.session.redirectUrl = redirectUrl; // Store redirect URL in session

        return res.redirect(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }

    res.status(200).json({ authenticated: true });
});

// Route to display individual product details
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found.');
        }
        res.render('productDetails', { product });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).send('Error loading product details.');
    }
});


module.exports = router;