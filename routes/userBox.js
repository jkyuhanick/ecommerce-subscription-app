const express = require('express');
const UserBox = require('../models/userBox');
const Product = require('../models/product');
const QuizResult = require('../models/quizResult');
const Subscription = require('../models/subscription');
const router = express.Router();

// Middleware to check if the user is logged in
function ensureLoggedIn(req, res, next) {
    if (req.session.user) {
        return next();
    }
    if (!req.xhr) {
        req.session.redirectUrl = req.originalUrl;
    }
    res.redirect('/login');
}

// Get the latest UserBox or create one for the logged-in user
router.get('/', ensureLoggedIn, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const quizResults = await QuizResult.findOne({ userId });
        const subscriptions = await Subscription.find({userId: req.session.user.id, active: 'true'})
                    .populate('productId')
                    .sort({startDate: -1});

        // if the user does not have any active subscriptions
        if(!subscriptions.length) {
            return res.render('user-box', {message: 'You do not have any active subscriptions.'});
        }

        // If the user hasn't completed the quiz
        if (!quizResults) {
            return res.render('user-box', { message: 'You must complete the beauty quiz before viewing your next box.' });
        }

        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        
        let finalChoiceOptions = []; 
        let finalChoice;

        let userBox = await UserBox.findOne({ userId, month, year })
            .populate('selectedProducts.product')  
            .populate('finalChoiceOptions.product')  
            .populate('finalChoice.product')  
            .exec();
    

        if (!userBox) {
            const categoryPreferences = quizResults.answers
                .map(answer => answer.answer.split(', ')) // Split comma-separated values
                .flat(); // Flatten into one array


            if (!Array.isArray(categoryPreferences) || categoryPreferences.length === 0) {
                throw new Error('No valid category preferences found');
            }

            // Fetch products that match category preferences or are general ("All")
            const products = await Product.find({
                $and: [
                    {
                        $or: [
                            { tags: { $in: categoryPreferences } },
                            { tags: { $regex: /All/i } }
                        ]
                    },
                    { subscription: false }
                ]
            }).limit(10);

            // Function to find the best variation for a product based on quiz results
            function selectBestVariation(product, quizResults) {
                let bestVariation = product.variations.find(variation =>
                    quizResults.answers.some(answer => answer.answer.includes(variation.shade))
                );

                // If no exact match, find the closest shade
                if (!bestVariation) {
                    let quizShades = quizResults.answers.flatMap(answer => answer.answer.split(', '));
                    bestVariation = product.variations.find(variation =>
                        quizShades.some(shade => shade.split(' ')[0] === variation.shade.split(' ')[0]) // Match by first word
                    );
                }

                // If still no match, pick a random variation
                if (!bestVariation) {
                    bestVariation = product.variations[Math.floor(Math.random() * product.variations.length)];
                }

                return bestVariation;
            }

            // Rank products by number of matching tags
            const rankedProducts = products.map(product => {
                const matchCount = product.tags.filter(tag => categoryPreferences.includes(tag)).length;
                return { product, matchCount };
            }).sort((a, b) => b.matchCount - a.matchCount); // Sort by most matches

            // Select top 4 most relevant products for the user's box
            let selectedProducts = rankedProducts.slice(0, 4).map(({ product }) => ({
                ...product.toObject(),
                selectedVariation: selectBestVariation(product, quizResults) // Store selected variation
            }));
            

            if (selectedProducts.length === 0) {
                const fallbackProduct = await Product.findOne({ subscription: false });
                if (fallbackProduct) {
                    selectedProducts.push(fallbackProduct);
                }
            }

            // Get final choice options from the next most relevant products
            finalChoiceOptions = rankedProducts.slice(4, 7).map(({ product }) => ({
                ...product.toObject(),
                selectedVariation: selectBestVariation(product, quizResults) // Store selected variation
            }));

            // Ensure finalChoice includes a variation
            if (finalChoice) {
                finalChoice = {
                    ...finalChoice.toObject(),
                    selectedVariation: selectBestVariation(finalChoice, quizResults)
                };
            }
                        
            // Select the best match as the final choice
            finalChoice = {
                product: finalChoiceOptions.length > 0 ? finalChoiceOptions[0] : null,
                selectedVariation: finalChoiceOptions[0].selectedVariation
            }

            userBox = new UserBox({
                userId,
                selectedProducts: selectedProducts.map(product => ({
                    product: product._id, 
                    selectedVariation: product.selectedVariation,
                })),
                finalChoiceOptions: finalChoiceOptions.map(option => ({
                    product: option._id,
                    selectedVariation: option.selectedVariation,
                })),
                finalChoice: {
                    product: finalChoice.product._id,
                    selectedVariation: finalChoice.selectedVariation
                },
                quizResults,
                month,
                year,
            });
            
            // Save the new user box
            await userBox.save();

            userBox = await UserBox.findById(userBox._id)
            .populate('selectedProducts.product') 
            .populate('finalChoiceOptions.product')  
            .populate('finalChoice.product')  
            .exec();
        }

        res.render('user-box', { 
            userBox, 
            finalChoiceOptions, 
            finalChoice, 
            quizResults,
            subscriptions
        });


    } catch (error) {
        console.error('Error fetching user box:', error);
        res.status(500).send('Error fetching user box');
    }
});



// Add a product to the UserBox
router.post('/add/:productId', ensureLoggedIn, async (req, res) => {
    const userId = req.session.user.id;
    const { productId } = req.params;
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    try {
        let userBox = await UserBox.findOne({ userId, month, year });
        if (!userBox) {
            userBox = new UserBox({ userId, selectedProducts: [], month, year });
        }

        if (!userBox.selectedProducts.includes(productId)) {
            userBox.selectedProducts.push(productId);
        }

        await userBox.save();
        res.redirect('/user-box');
    } catch (error) {
        console.error('Error adding product to user box:', error);
        res.status(500).send('Error adding product');
    }
});

// Set the final choice for the UserBox
router.post('/final-choice/:productId', ensureLoggedIn, async (req, res) => {
    const userId = req.session.user.id;
    const { productId } = req.params;
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    try {
        let userBox = await UserBox.findOne({ userId, month, year });
        if (!userBox) {
            return res.status(404).send('UserBox not found');
        }

        // Find the selected product from finalChoiceOptions based on productId
        const selectedOption = userBox.finalChoiceOptions.find(option => option.product._id.toString() === productId);
        console.log('productId: ', productId);
        console.log('selectedOption: ', selectedOption);

        if (!selectedOption) {
            return res.status(404).send('Selected final choice product not found');
        }

        // Set the final choice with the correct product and selectedVariation
        userBox.finalChoice = {
            product: selectedOption.product._id,  // Assign the product ID correctly
            selectedVariation: selectedOption.selectedVariation  // Assign the selectedVariation from the selected option
        };

        // Save the updated UserBox
        await userBox.save();

        // Populate the finalChoice with product details
        userBox = await UserBox.findOne({ userId, month, year })
            .populate('selectedProducts.product')  
            .populate('finalChoiceOptions.product')  
            .populate('finalChoice.product')  // Populate finalChoice
            .exec();

        // Render the page with the populated userBox
        res.render('user-box', { userBox, finalChoice: userBox.finalChoice }); 
    } catch (error) {
        console.error('Error setting final choice:', error);
        res.status(500).send('Error setting final choice');
    }
});


// Remove a product from the UserBox
router.post('/remove/:productId', ensureLoggedIn, async (req, res) => {
    const userId = req.session.user.id;
    const { productId } = req.params;
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    try {
        let userBox = await UserBox.findOne({ userId, month, year });
        if (!userBox) {
            return res.status(404).send('UserBox not found');
        }

        userBox.selectedProducts = userBox.selectedProducts.filter(id => id.toString() !== productId);
        if (userBox.finalChoice && userBox.finalChoice.toString() === productId) {
            userBox.finalChoice = null;
        }

        await userBox.save();
        res.redirect('/user-box');
    } catch (error) {
        console.error('Error removing product:', error);
        res.status(500).send('Error removing product');
    }
});

module.exports = router;