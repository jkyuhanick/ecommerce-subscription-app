const mongoose = require('mongoose');
const QuizData = require('./models/quizData'); // Adjust the path based on your file structure
require('dotenv').config(); // Load environment variables

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

const seedQuizData = async () => {
    try {
        const quiz = new QuizData({
            questions: [
                {
                    text: 'What is your skin tone?',
                    options: ['Fair Warm', 'Fair Cool', 'Fair Neutral', 'Medium Warm', 'Medium Cool', 'Medium Neutral', 'Deep Warm', 'Deep Cool', 'Deep Neutral', 'Deep Dark Warm', 'Deep Dark Cool', 'Deep Dark Neutral']
                },
                {
                    text: 'What is your eye color?',
                    options: ['Brown', 'Blue', 'Green', 'Hazel', 'Gray']
                },
                {
                    text: 'What is the color of your hair?',
                    options: ['Light Brown', 'Medium Brown', 'Dark Brown', 'Black', 'Platimum Blonde', 'Blonde', 'Dirty Blonde', 'Strawberry Blone', 'Red', 'Gray', 'Colored (Pink, Purole, Blue, etc.)']
                },
                {
                    text: 'What is your hair texture?',
                    options: ['Straight', 'Wavy', 'Curly']
                },
                {
                    text: 'What is your skin type?',
                    options: ['Dry', 'Combination', 'Oily']
                },
                {
                    text: 'What are your skin concerns?',
                    options: ['Sensitive', 'Aging', 'Blemishes', 'Enlarged Pores', 'Dark Spots'],
                    allowMultiple: true
                },
                {
                    text: 'Select the following products you are most interested in receiving:',
                    options: ['Face Makeup', 'Lip Makeup', 'Cheek Makeup', 'Eye Makeup', 'Facial Cleansers', 'Facial Moisturizers', 'Facial Treatments', 'Lip Care', 'Makeup Tools', 'Nails', 'Hair Care', 'Body Care', 'Fragrance'],
                    allowMultiple: true
                }
            ]
        });

        await quiz.save();
        console.log('Quiz data saved successfully!');
        mongoose.connection.close(); // Close the database connection
    } catch (error) {
        console.error('Error saving quiz data:', error);
        mongoose.connection.close();
    }
};

// Run the script
connectDB().then(seedQuizData);