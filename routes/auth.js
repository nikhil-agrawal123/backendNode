const express = require('express');
const { body } = require('express-validator');
const {
    registerDoctor,
    loginDoctor,
    registerPatient,
    loginPatient,
    logout,
    getCurrentUser
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const doctorRegistrationValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('phone')
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('specialization')
        .notEmpty()
        .withMessage('Specialization is required'),
    body('experience')
        .isInt({ min: 0, max: 50 })
        .withMessage('Experience must be between 0 and 50 years'),
    body('age')
        .isInt({ min: 25, max: 80 })
        .withMessage('Age must be between 25 and 80'),
    body('gender')
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Gender must be Male, Female, or Other'),
    body('consultationFee')
        .isFloat({ min: 0 })
        .withMessage('Consultation fee must be a positive number')
];

const patientRegistrationValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('phone')
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('age')
        .isInt({ min: 1, max: 120 })
        .withMessage('Age must be between 1 and 120'),
    body('gender')
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Gender must be Male, Female, or Other')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Doctor routes
router.post('/doctor/register', doctorRegistrationValidation, registerDoctor);
router.post('/doctor/login', loginValidation, loginDoctor);

// Patient routes
router.post('/patient/register', patientRegistrationValidation, registerPatient);
router.post('/patient/login', loginValidation, loginPatient);

// Common routes
router.post('/logout', logout);
router.get('/me',  getCurrentUser);

// Health check for auth routes
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth routes are working',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
