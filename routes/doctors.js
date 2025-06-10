const express = require('express');
const { body, query } = require('express-validator');
const {
    getDoctorProfile,
    updateDoctorProfile,
    getAllDoctors,
    getDoctorAppointments,
    getDoctorDashboard,
    getAvailableSlots
} = require('../controllers/doctorController');
const { requireAuth, requireDoctor } = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');
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
    body('specialization')
        .optional()
        .notEmpty()
        .withMessage('Specialization cannot be empty'),
    body('experience')
        .optional()
        .isInt({ min: 0, max: 50 })
        .withMessage('Experience must be between 0 and 50 years'),
    body('age')
        .optional()
        .isInt({ min: 25, max: 80 })
        .withMessage('Age must be between 25 and 80'),
    body('gender')
        .optional()
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Gender must be Male, Female, or Other'),
    body('consultationFee')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Consultation fee must be a positive number')
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

// Doctor-specific routes (require doctor authentication)
router.get('/profile', getDoctorProfile);
router.put('/profile', updateProfileValidation, updateDoctorProfile);
router.get('/appointments', queryValidation, getDoctorAppointments);
router.get('/dashboard', getDoctorDashboard);
router.get('/available-slots', getAvailableSlots);

router.get('/:id/available-slots', (req, res) => {
    appointmentController.getAvailableSlots(req, res);
});
router.get('/:id', (req, res) => {
    appointmentController.getDoctorById(req, res);
});

router.get('/', (req, res) => {
    appointmentController.getAllDoctors(req, res);
});

// Health check for doctor routes
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Doctor routes are working',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;