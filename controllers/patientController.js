const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

// Get patient profile
const getPatientProfile = async (req, res) => {
    try {
        const patient = await Patient.findById(req.user.id);
        if (!patient) {
            return res.status(404).json({
                error: 'Patient not found',
                message: 'Patient profile not found'
            });
        }
        console.log('Patient profile retrieved:', patient);
        res.json({
            success: true,
            patient
        });
    } catch (error) {
        console.error('Get patient profile error:', error);
        res.status(500).json({
            error: 'Failed to get profile',
            message: error.message
        });
    }
};

// Update patient profile
const updatePatientProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const allowedUpdates = [
            'name', 'phone', 'age', 'gender', 'bloodGroup',
            'medicalHistory', 'allergies', 'currentMedications',
            'emergencyContact', 'profileImage'
        ];

        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const patient = await Patient.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!patient) {
            return res.status(404).json({
                error: 'Patient not found',
                message: 'Patient profile not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            patient
        });

    } catch (error) {
        console.error('Update patient profile error:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            message: error.message
        });
    }
};

// Get patient's appointments
const getPatientAppointments = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        const query = { patientId: req.user.id };
        if (status) {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .populate('doctorId', 'name email phone specialization consultationFee rating')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ appointmentDate: -1 });

        const total = await Appointment.countDocuments(query);

        res.json({
            success: true,
            appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get patient appointments error:', error);
        res.status(500).json({
            error: 'Failed to get appointments',
            message: error.message
        });
    }
};

// Get patient dashboard data
const getPatientDashboard = async (req, res) => {
    try {
        const patientId = req.user.id;

        // Get patient info
        const patient = await Patient.findById(patientId);
        
        // Get appointment statistics
        const totalAppointments = await Appointment.countDocuments({ patientId });
        const upcomingAppointments = await Appointment.countDocuments({
            patientId,
            status: 'scheduled',
            appointmentDate: { $gte: new Date() }
        });
        const completedAppointments = await Appointment.countDocuments({
            patientId,
            status: 'completed'
        });

        // Get recent appointments
        const recentAppointments = await Appointment.find({ patientId })
            .populate('doctorId', 'name specialization rating')
            .sort({ appointmentDate: -1 })
            .limit(5);

        // Get recommended doctors based on patient's medical history
        const recommendedDoctors = await Doctor.find({})
            .select('name specialization rating consultationFee')
            .sort({ rating: -1 })
            .limit(5);

        res.json({
            success: true,
            dashboard: {
                patient: {
                    name: patient.name,
                    age: patient.age,
                    bloodGroup: patient.bloodGroup
                },
                statistics: {
                    totalAppointments,
                    upcomingAppointments,
                    completedAppointments
                },
                recentAppointments,
                recommendedDoctors
            }
        });

    } catch (error) {
        console.error('Get patient dashboard error:', error);
        res.status(500).json({
            error: 'Failed to get dashboard data',
            message: error.message
        });
    }
};

// Search doctors
const searchDoctors = async (req, res) => {
    try {
        const { 
            specialization, 
            name, 
            minRating = 0, 
            maxFee,
            page = 1, 
            limit = 10 
        } = req.query;

        const query = {};
        
        if (specialization) {
            query.specialization = { $regex: specialization, $options: 'i' };
        }
        
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        
        if (minRating) {
            query.rating = { $gte: parseFloat(minRating) };
        }
        
        if (maxFee) {
            query.consultationFee = { $lte: parseFloat(maxFee) };
        }

        const doctors = await Doctor.find(query)
            .select('-password')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ rating: -1, totalPatients: -1 });

        const total = await Doctor.countDocuments(query);

        res.json({
            success: true,
            doctors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Search doctors error:', error);
        res.status(500).json({
            error: 'Failed to search doctors',
            message: error.message
        });
    }
};

// Get doctor details
const getDoctorDetails = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const doctor = await Doctor.findById(doctorId).select('-password');
        if (!doctor) {
            return res.status(404).json({
                error: 'Doctor not found',
                message: 'Doctor not found'
            });
        }

        // Get doctor's recent reviews (from completed appointments)
        const recentReviews = await Appointment.find({
            doctorId,
            status: 'completed',
            'rating.score': { $exists: true }
        })
        .populate('patientId', 'name')
        .select('rating createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

        res.json({
            success: true,
            doctor,
            recentReviews
        });

    } catch (error) {
        console.error('Get doctor details error:', error);
        res.status(500).json({
            error: 'Failed to get doctor details',
            message: error.message
        });
    }
};

module.exports = {
    getPatientProfile,
    updatePatientProfile,
    getPatientAppointments,
    getPatientDashboard,
    searchDoctors,
    getDoctorDetails
};
