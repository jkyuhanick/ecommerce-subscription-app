const mongoose = require('mongoose');
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

const seedProductData = async () => {
    try {
        // Delete existing products
        await Product.deleteMany();

        const products = [
            {
                name: "Rebillable Monthly Membership",
                description: "Renews at $25.00/1 month",
                category: "Subscription",
                subscription: true,
                brand: "BeautyBox",
                tags: ["All"],
                rating: 4.7,
                reviews: [],
                variations: [
                    {
                        price: 25.00,
                        stock: 1000000,
                        images: ["/uploads/subscription1.avif", "/uploads/subscription2.avif"],
                    }
                ]
            },
            {
                name: "Rebillable 3-Month Membership",
                description: "Renews at $72.00/3 month",
                category: "Subscription",
                subscription: true,
                brand: "BeautyBox",
                tags: ["All"],
                rating: 4.7,
                reviews: [],
                variations: [
                    {
                        price: 72.00,
                        stock: 1000000,
                        images: ["/uploads/subscription1.avif", "/uploads/subscription2.avif"],
                    }
                ]
            },
            {
                name: "Rebillable 12-Month Membership",
                description: "Renews at $264.00/1 year",
                category: "Subscription",
                subscription: true,
                brand: "BeautyBox",
                tags: ["All"],
                rating: 4.7,
                reviews: [],
                variations: [
                    {
                        price: 264.00,
                        stock: 1000000,
                        images: ["/uploads/subscription1.avif", "/uploads/subscription2.avif"],
                    }
                ]
            },
            // Brand: LuxeGlow
            {
                name: "Hydrating Serum",
                description: "A deep hydrating serum that revitalizes the skin.",
                category: "Skincare",
                brand: "LuxeGlow",
                tags: ["Dry", "Combination", "Oily", "Sensitive", "Aging", "Blemishes", "Enlarged Pores", "Dark Spots", "Facial Treatments", "Facial Moisturizers"],
                rating: 4.8,
                reviews: [],
                variations: [
                    {
                        shade: "30ml",
                        price: 45.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_serum_30ml.jpg.avif", "/uploads/luxeglow_serum_30ml2.jpg.avif"],
                    },
                    {
                        shade: "50ml",
                        price: 65.00,
                        stock: 50,
                        images: ["/uploads/luxeglow_serum_50ml.jpg.avif", "/uploads/luxeglow_serum_50ml2.jpg.avif"],
                    }
                ]
            },
            {
                name: "Radiant Foundation",
                description: "A smooth and buildable foundation that gives your skin a radiant finish.",
                category: "Face Makeup",
                brand: "LuxeGlow",
                tags: ["Dry", "Combination", "Fair Warm", "Fair Cool", "Fair Neutral", "Medium Warm", "Medium Cool", "Medium Neutral", "Deep Warm", "Deep Cool", "Deep Neutral", "Deep Dark Warm", "Deep Dark Cool", "Deep Dark Neutral", "Sensitive", "Aging", "Blemishes", "Dark Spots", "Face Makeup"],
                rating: 4.7,
                reviews: [],
                variations: [
                    {
                        shade: "Fair Warm",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationfairwarm.jpg"],
                    },
                    {
                        shade: "Fair Cool",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationfaircool.jpg"],
                    },
                    {
                        shade: "Fair Neutral",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationfairneutral.jpg"],
                    },
                    {
                        shade: "Medium Warm",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationmediumwarm.jpg"],
                    },
                    {
                        shade: "Medium Cool",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationmediumcool.jpg"],
                    },
                    {
                        shade: "Medium Neutral",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationmediumneutral.jpg"],
                    },
                    {
                        shade: "Deep Warm",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationdeepwarm.jpg"],
                    },
                    {
                        shade: "Deep Cool",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationdeepcool.jpg"],
                    },
                    {
                        shade: "Deep Neutral",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationdeepneutral.jpg"],
                    },
                    {
                        shade: "Deep Dark Warm",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationdeepdarkwarm.jpg"],
                    },
                    {
                        shade: "Deep Dark Cool",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationdeepdarkcool.jpg"],
                    },
                    {
                        shade: "Deep Dark Neutral",
                        price: 32.00,
                        stock: 100,
                        images: ["/uploads/luxeglow_foundation.pg.jpeg", "/uploads/luxeglow_foundationdeepdarkneutral.jpg"],
                    }
                ]                
            },
            {
                name: "Matte Lipstick",
                description: "A long-lasting matte lipstick available in a range of shades.",
                category: "Lip Makeup",
                brand: "LuxeGlow",
                tags: ["Fair Warm", "Fair Cool", "Fair Neutral", "Medium Warm", "Medium Cool", "Medium Neutral", "Deep Warm", "Deep Cool", "Deep Neutral", "Deep Dark Warm", "Deep Dark Cool", "Deep Dark Neutral", "Dry", "Combination", "Oily", "Lip Makeup", "Lip Care"],
                rating: 4.6,
                reviews: [],
                variations: [
                    {
                        shade: "Crimson Red",
                        price: 18.00,
                        stock: 200,
                        images: ["/uploads/luxeglow_lipstick_crimson.jpg.avif"],
                    },
                    {
                        shade: "Nude Beige",
                        price: 18.00,
                        stock: 0,
                        images: ["/uploads/luxeglow_lipstick_nude.jpg.avif"],
                    }
                ]
            },

            // Brand: GlowUp Cosmetics
            {
                name: "Vitamin C Serum",
                description: "A powerful serum with Vitamin C to brighten and even skin tone.",
                category: "Skincare",
                brand: "GlowUp Cosmetics",
                tags: ["Dark Spots", "Aging", "Enlarged Pores", "Dry", "Combination", "Oily", "Facial Treatment"],
                rating: 4.9,
                reviews: [],
                variations: [
                    {
                        shade: "15ml",
                        price: 40.00,
                        stock: 150,
                        images: ["/uploads/glowup_vitc_serum.jpg.avif"],
                    },
                    {
                        shade: "30ml",
                        price: 60.00,
                        stock: 75,
                        images: ["/uploads/glowup_vitc_serum.jpg.avif"],
                    }
                ]
            },
            {
                name: "Shimmer Highlighter",
                description: "A glimmering highlighter for a radiant, glowing finish.",
                category: "Face Makeup",
                brand: "GlowUp Cosmetics",
                tags: ["Dry", "Combination", "Fair Warm", "Fair Cool", "Fair Neutral", "Medium Warm", "Medium Cool", "Medium Neutral", "Deep Warm", "Deep Cool", "Deep Neutral", "Deep Dark Warm", "Deep Dark Cool", "Deep Dark Neutral", "Aging", "Face Makeup"],
                rating: 4.7,
                reviews: [],
                variations: [
                    {
                        shade: "Golden Glow",
                        price: 25.00,
                        stock: 150,
                        images: ["/uploads/glowup_highlighter_gold.jpg.avif"],
                    },
                    {
                        shade: "Pearl Shine",
                        price: 25.00,
                        stock: 150,
                        images: ["/uploads/glowup_highlighter_pearl.jpg.avif"],
                    }
                ]
            },
            {
                name: "Ultra Matte Foundation",
                description: "A full-coverage, matte foundation that lasts all day.",
                category: "Face Makeup",
                brand: "GlowUp Cosmetics",
                tags: ["Oily", "Combination", "Fair Cool", "Fair Neutral", "Medium Warm", "Medium Cool", "Medium Neutral", "Deep Warm", "Deep Cool", "Deep Dark Neutral", "Sensitive", "Blemishes", "Dark Spots", "Enlarged Pores", "Face Makeup"],
                rating: 4.8,
                reviews: [],
                variations: [
                    {
                        shade: "Fair Cool",
                        price: 38.00,
                        stock: 100,
                        images: ["/uploads/glowup_foundation.jpg.avif", "/uploads/glowup_foundation_porcelain.jpg"],
                    },
                    {
                        shade: "Fair Neutral",
                        price: 38.00,
                        stock: 100,
                        images: ["/uploads/glowup_foundation.jpg.avif", "/uploads/glowup_foundation_vanilla.jpg"],
                    },
                    {
                        shade: "Medium Warm",
                        price: 38.00,
                        stock: 100,
                        images: ["/uploads/glowup_foundation.jpg.avif", "/uploads/glowup_foundation_softbeige.jpg"],
                    },
                    {
                        shade: "Medium Cool",
                        price: 38.00,
                        stock: 100,
                        images: ["/uploads/glowup_foundation.jpg.avif", "/uploads/glowup_foundation_mediumolive.jpg"],
                    },
                    {
                        shade: "Medium Neutral",
                        price: 38.00,
                        stock: 100,
                        images: ["/uploads/glowup_foundation.jpg.avif", "/uploads/glowup_foundation_honey.jpg"],
                    },
                    {
                        shade: "Deep Warm",
                        price: 38.00,
                        stock: 100,
                        images: ["/uploads/glowup_foundation.jpg.avif", "/uploads/glowup_foundation_cappuccino.jpg"],
                    },
                    {
                        shade: "Deep Cool",
                        price: 38.00,
                        stock: 100,
                        images: ["/uploads/glowup_foundation.jpg.avif", "/uploads/glowup_foundation_espresso.jpg"],
                    },
                    {
                        shade: "Deep Dark Neutral",
                        price: 38.00,
                        stock: 100,
                        images: ["/uploads/glowup_foundation.jpg.avif", "/uploads/glowup_foundation_deeprich.jpg"],
                    },
                ]
            },

            // Brand: PureEssence
            {
                name: "Nourishing Night Cream",
                description: "A rich night cream that deeply nourishes and repairs overnight.",
                category: "Skincare",
                brand: "PureEssence",
                tags: ["Aging", "Dry", "Sensitive", "Facial Moisturizers"],
                rating: 4.6,
                reviews: [],
                variations: [
                    {
                        shade: "50ml",
                        price: 55.00,
                        stock: 100,
                        images: ["/uploads/pureessence_nightcream.jpg.avif"],
                    },
                    {
                        shade: "100ml",
                        price: 90.00,
                        stock: 40,
                        images: ["/uploads/pureessence_nightcream.jpg.avif"],
                    }
                ]
            },
            {
                name: "Lip Care Balm",
                description: "A moisturizing lip balm that softens and smooths lips.",
                category: "Lip Care",
                brand: "PureEssence",
                tags: ["Sensitive", "Dry", "Combination", "Oily", "Lip Care", "Aging"],
                rating: 4.7,
                reviews: [],
                variations: [
                    {
                        shade: "Clear",
                        price: 10.00,
                        stock: 300,
                        images: ["/uploads/pureessence_lipbalm_clear.jpg.avif"],
                    },
                    {
                        shade: "Rose",
                        price: 10.00,
                        stock: 300,
                        images: ["/uploads/pureessence_lipbalm_rose.jpg.avif"],
                    }
                ]
            },
            {
                name: "Hydrating Mist",
                description: "A refreshing mist to hydrate and balance the skin.",
                category: "Skincare",
                brand: "PureEssence",
                tags: ["Sensitive", "Aging", "Dry", "Combination", "Oily", "Facial Treatments"],
                rating: 4.5,
                reviews: [],
                variations: [
                    {
                        shade: "100ml",
                        price: 20.00,
                        stock: 200,
                        images: ["/uploads/pureessence_mist_100ml.jpg.avif"],
                    }
                ]
            },

            // Brand: NovaGlow (Haircare & Nailcare)
            {
                name: "Volume Shampoo",
                description: "A volumizing shampoo that adds fullness to fine hair.",
                category: "Hair Care",
                brand: "NovaGlow",
                tags: ["Wavy", "Straight", "Hair Care"],
                rating: 4.6,
                reviews: [],
                variations: [
                    {
                        shade: "300ml",
                        price: 22.00,
                        stock: 150,
                        images: ["/uploads/novaglow_shampoo_vol_300ml.jpg.avif"],
                    }
                ]
            },
            {
                name: "Moisturizing Conditioner",
                description: "A nourishing conditioner that hydrates and strengthens hair.",
                category: "Hair Care",
                brand: "NovaGlow",
                tags: ["Straight", "Wavy", "Curly", "Hair Care"],
                rating: 4.7,
                reviews: [],
                variations: [
                    {
                        shade: "300ml",
                        price: 24.00,
                        stock: 150,
                        images: ["/uploads/novaglow_shampoo_vol_300ml.jpg.avif"],
                    }
                ]
            },
            {
                name: "Nail Polish",
                description: "A long-lasting nail polish with a glossy finish.",
                category: "Nails",
                brand: "NovaGlow",
                tags: ["Nails"],
                rating: 4.5,
                reviews: [],
                variations: [
                    {
                        shade: "Berry Crush",
                        price: 8.00,
                        stock: 200,
                        images: ["/uploads/novaglow_nailpolish_berry.jpg.avif"],
                    },
                    {
                        shade: "Pale Pink",
                        price: 8.00,
                        stock: 200,
                        images: ["/uploads/novaglow_nailpolish_pale.jpg.avif"],
                    }
                ]
            },

            // Brand: Enchanted Glow (Makeup Tools & Fragrance)
            {
                name: "Makeup Brush Set",
                description: "A complete makeup brush set for flawless application.",
                category: "Makeup Tools",
                brand: "Enchanted Glow",
                tags: ["Makeup Tools"],
                rating: 4.9,
                reviews: [],
                variations: [
                    {
                        shade: "10-Piece Set",
                        price: 45.00,
                        stock: 100,
                        images: ["/uploads/enchantedglow_brushset.jpg.avif"],
                    }
                ]
            },
            {
                name: "Eau de Parfum",
                description: "A captivating fragrance with floral and woody notes.",
                category: "Fragrance",
                brand: "Enchanted Glow",
                tags: ["Fragrance"],
                rating: 4.8,
                reviews: [],
                variations: [
                    {
                        shade: "50ml",
                        price: 55.00,
                        stock: 120,
                        images: ["/uploads/enchantedglow_perfume.jpg.avif"],
                    }
                ]
            }
        ];

        // Insert products into the database
        await Product.insertMany(products);
        console.log('Product data saved successfully!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error saving product data:', error);
        mongoose.connection.close();
    }
};

// Run the script
connectDB().then(seedProductData);