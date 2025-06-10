const express = require('express');
const { body, param, query } = require('express-validator');
const {
    bookAppointment,
    getAppointment,
    updateAppointment,
    cancelAppointment,
    rateAppointment,
    getAppointmentStats
} = require('../controllers/appointmentController');
const { requireAuth, requirePatient, requireDoctor } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const bookAppointmentValidation = [
    body('doctorId')
        .isMongoId()
        .withMessage('Invalid doctor ID'),
    body('appointmentDate')
        .isISO8601()
        .withMessage('Invalid appointment date format'),
    body('timeSlot')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid time slot format (HH:MM-HH:MM)'),
    body('symptoms')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Symptoms description cannot exceed 500 characters'),
    body('consultationType')
        .optional()
        .isIn(['video', 'audio', 'chat'])
        .withMessage('Consultation type must be video, audio, or chat')
];

const appointmentIdValidation = [
    param('appointmentId')
        .isMongoId()
        .withMessage('Invalid appointment ID')
];

const ratingValidation = [
    body('score')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating score must be between 1 and 5'),
    body('feedback')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Feedback cannot exceed 500 characters')
];

const queryValidation = [
    query('status')
        .optional()
        .isIn(['scheduled', 'ongoing', 'completed', 'cancelled', 'no-show'])
        .withMessage('Invalid status'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
];

// Appointment routes
router.post('/', bookAppointmentValidation, bookAppointment);
router.get('/stats', getAppointmentStats);
router.get('/:appointmentId', appointmentIdValidation, getAppointment);
router.put('/:appointmentId', appointmentIdValidation, updateAppointment);
router.delete('/:appointmentId', appointmentIdValidation, cancelAppointment);
router.post('/:appointmentId/rate', appointmentIdValidation, ratingValidation, rateAppointment);

// Health check for appointment routes
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Appointment routes are working',
        timestamp: new Date().toISOString()
    });
});

// Add these routes after your existing ones
router.put('/:id/status',  (req, res) => {
    appointmentController.updateAppointmentStatus(req, res);
});

router.put('/:id/reschedule', (req, res) => {
    appointmentController.rescheduleAppointment(req, res);
});

// Add this route for video call integration
router.get('/:appointmentId/video', appointmentIdValidation, (req, res) => {
    const { appointmentId } = req.params;
    const meetingConfig = {
        roomName: `HealthChat-${appointmentId}`,
        domain: 'meet.jit.si',
        meetingLink: `https://meet.jit.si/HealthChat-${appointmentId}`
    };
    
    res.json({
        success: true,
        meetingConfig
    });
});

module.exports = router;
