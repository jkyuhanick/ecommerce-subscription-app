const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: mongoose.Schema.Types.Mixed, required: true }],
    allowMultiple: { type: Boolean, default: false },
});

const quizDataSchema = new mongoose.Schema({
    questions: [questionSchema],
}, { timestamps: true });

module.exports = mongoose.model('quizData', quizDataSchema);