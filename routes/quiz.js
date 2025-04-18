const express = require('express');
const router = express.Router();
const QuizResult = require('../models/quizResult');
const QuizData = require('../models/quizData');

// Render the quiz page
router.get('/', async (req, res) => {

    try {
        // Ensure currentQuestionIndex is always initialized to 0 when starting a new quiz session
        if (req.session.currentQuestionIndex === undefined || req.session.currentQuestionIndex === null) {
            req.session.currentQuestionIndex = 0;
        }
        if (!req.session.quizAnswers) req.session.quizAnswers = [];

        const quizDataDoc = await QuizData.findOne();
        if (!quizDataDoc || quizDataDoc.questions.length === 0) {
            return res.status(500).send('No quiz questions found.');
        }

        const questions = quizDataDoc.questions;
        const questionIndex = req.session.currentQuestionIndex;

        // Check if the first question should be displayed
        if (questionIndex >= questions.length) {
            return res.redirect('/quiz/save');  // Save the quiz results if all questions are answered
        }

        // Retrieve the stored answer for the current question
        const storedAnswer = req.session.quizAnswers[questionIndex] || null;

        res.render('quiz', {
            currentQuestion: questions[questionIndex],
            currentQuestionIndex: questionIndex + 1, 
            totalQuestions: questions.length,
            currentAnswer: storedAnswer,
            quizAnswers: req.session.quizAnswers,
            isFirstQuestion: questionIndex === 0,
            isLastQuestion: questionIndex === questions.length - 1,
        });
    } catch (error) {
        console.error('Error fetching quiz data:', error);
        res.status(500).send('Error loading the quiz.');
    }
});



// Handle "Next" button
router.post('/next', (req, res) => {
    const questionIndex = parseInt(req.body.questionIndex, 10) - 1;
    let answer = req.body.answer;

    // Ensure answer is always stored as an array for checkboxes
    if (!Array.isArray(answer)) {
        answer = answer ? [answer] : [];
    }

    req.session.quizAnswers[questionIndex] = answer;
    req.session.currentQuestionIndex = questionIndex + 1;

    res.redirect('/quiz');
});

// Handle "Previous" button
router.post('/previous', (req, res) => {
    const questionIndex = parseInt(req.body.questionIndex, 10) - 1;
    req.session.currentQuestionIndex = questionIndex - 1;
    res.redirect('/quiz');
});



// Handle the save route after quiz completion
router.get('/save', async (req, res) => {
    if (!req.session.quizAnswers || !req.session.user) {
        return res.redirect('/quiz'); // Redirect to the quiz if session data is missing
    }

    try {
        const quizDataDoc = await QuizData.findOne();
        if (!quizDataDoc) {
            return res.status(500).send('Quiz data not found.');
        }

        // Process answers to ensure arrays are converted to strings
        const answers = quizDataDoc.questions.map((question, index) => {
            const answer = req.session.quizAnswers[index];
            return {
                question: question.text,
                answer: Array.isArray(answer) ? answer.join(', ') : answer || 'No answer', // Convert arrays to a comma-separated string
            };
        });

        // Check if a result already exists for the user
        const existingResult = await QuizResult.findOne({ userId: req.session.user.id });

        if (existingResult) {
            // Update the existing result
            existingResult.answers = answers;
            await existingResult.save();
        } else {
            // Create a new result
            const quizResult = new QuizResult({
                userId: req.session.user.id,
                answers,
            });
            await quizResult.save();
        }

        // Clear session data after saving
        req.session.quizAnswers = null;
        req.session.currentQuestionIndex = null;

        // Check if the 'redirectTo' query parameter exists
        if (req.query.redirectTo === 'subscriptions') {
            res.redirect('/subscriptions'); // Redirect to the subscription page
        } else {
            res.render('save-confirmation', {
                message: 'Your quiz answers have been saved successfully!',
            });
        }

    } catch (error) {
        console.error('Error saving quiz results:', error);
        res.status(500).send('Error saving quiz results.');
    }
});


// Render a confirmation page after saving
router.get('/save-confirmation', (req, res) => {
    res.render('save-confirmation', {
        message: 'Your quiz answers have been saved successfully',
    });
});


router.get('/update', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    try {
        // Fetch the user's previous quiz results (if any)
        const quizResults = await QuizResult.findOne({ userId: req.session.user.id });
        const quizDataDoc = await QuizData.findOne();

        if (!quizDataDoc || quizDataDoc.questions.length === 0) {
            return res.status(500).send('Quiz data not found.');
        }

        if (quizResults) {
            // Initialize session variables with previous answers
            req.session.quizAnswers = quizResults.answers.map((answer) => answer.answer);
        } else {
            // Initialize session variables if no previous results
            req.session.quizAnswers = [];
        }

        // Reset the current question index explicitly to 0 (first question)
        req.session.currentQuestionIndex = 0;

        // Ensure all other quiz-related session data is cleared to avoid issues
        req.session.quizAnswers = req.session.quizAnswers || [];

        // Redirect to the quiz
        res.redirect('/quiz');
    } catch (error) {
        console.error('Error updating quiz:', error);
        res.status(500).send('Error updating quiz.');
    }
});


router.get('/status', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const quizResult = await QuizResult.findOne({ userId: req.session.user.id });
        res.json({ hasCompletedQuiz: !!quizResult }); // Respond with quiz completion status
    } catch (error) {
        console.error(error);
        res.status(500).send('Error checking quiz status');
    }
});

module.exports = router;
