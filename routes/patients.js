const express = require('express');
const { body, query, param } = require('express-validator');
const {
    getPatientProfile,
    updatePatientProfile,
    getPatientAppointments,
    getPatientDashboard,
    searchDoctors,
    getDoctorDetails,
} = require('../controllers/patientController');
const { requireAuth, requirePatient } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('age')
        .optional()
        .isInt({ min: 1, max: 120 })
        .withMessage('Age must be between 1 and 120'),
    body('gender')
        .optional()
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Gender must be Male, Female, or Other'),
    body('bloodGroup')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group')
];

const queryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
];

const searchValidation = [
    query('minRating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Rating must be between 0 and 5'),
    query('maxFee')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Fee must be a positive number'),
    ...queryValidation
];

const doctorIdValidation = [
    param('doctorId')
        .isMongoId()
        .withMessage('Invalid doctor ID')
];

// Patient-specific routes (require patient authentication)
router.get('/profile', requirePatient, getPatientProfile);
router.put('/profile', requirePatient, updateProfileValidation, updatePatientProfile);
router.get('/appointments', requirePatient, queryValidation, getPatientAppointments);
router.get('/dashboard', requirePatient, getPatientDashboard);

// Doctor search and details (accessible by patients)
router.get('/doctors/search', requirePatient, searchValidation, searchDoctors);
router.get('/doctors/:doctorId', requirePatient, doctorIdValidation, getDoctorDetails);

// Health check for patient routes
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Patient routes are working',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
