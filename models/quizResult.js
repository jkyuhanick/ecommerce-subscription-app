const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    answers: [
        {
            question: String,
            answer: mongoose.Schema.Types.Mixed,
        },
    ],
});

module.exports = mongoose.model('quizResult', quizResultSchema);