const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

// Get doctor profile
const getDoctorProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user.id);
        if (!doctor) {
            return res.status(404).json({
                error: 'Doctor not found',
                message: 'Doctor profile not found'
            });
        }

        res.json({
            success: true,
            doctor
        });
    } catch (error) {
        console.error('Get doctor profile error:', error);
        res.status(500).json({
            error: 'Failed to get profile',
            message: error.message
        });
    }
};

// Update doctor profile
const updateDoctorProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const allowedUpdates = [
            'name', 'phone', 'specialization', 'experience', 
            'qualifications', 'age', 'gender', 'consultationFee', 
            'availability', 'profileImage'
        ];

        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const doctor = await Doctor.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!doctor) {
            return res.status(404).json({
                error: 'Doctor not found',
                message: 'Doctor profile not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            doctor
        });

    } catch (error) {
        console.error('Update doctor profile error:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            message: error.message
        });
    }
};

// Get all doctors (for patient to search)
const getAllDoctors = async (req, res) => {
    try {
        const { specialization, page = 1, limit = 10 } = req.query;
        
        const query = {};
        if (specialization) {
            query.specialization = specialization;
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
        console.error('Get all doctors error:', error);
        res.status(500).json({
            error: 'Failed to get doctors',
            message: error.message
        });
    }
};

// Get doctor's appointments
const getDoctorAppointments = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        const query = { doctorId: req.user.id };
        if (status) {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name email phone age gender')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ appointmentDate: 1 });

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
        console.error('Get doctor appointments error:', error);
        res.status(500).json({
            error: 'Failed to get appointments',
            message: error.message
        });
    }
};

// Get doctor dashboard data
const getDoctorDashboard = async (req, res) => {
    try {
        const doctorId = req.user.id;

        // Get doctor info
        const doctor = await Doctor.findById(doctorId);
        
        // Get appointment statistics
        const totalAppointments = await Appointment.countDocuments({ doctorId });
        const todayAppointments = await Appointment.countDocuments({
            doctorId,
            appointmentDate: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lt: new Date().setHours(23, 59, 59, 999)
            }
        });
        const upcomingAppointments = await Appointment.countDocuments({
            doctorId,
            status: 'scheduled',
            appointmentDate: { $gte: new Date() }
        });

        // Get recent appointments
        const recentAppointments = await Appointment.find({ doctorId })
            .populate('patientId', 'name email phone')
            .sort({ appointmentDate: -1 })
            .limit(5);
        
        const uniquePatientCount = await Appointment.distinct('patientId', { doctorId }).length;

        res.json({
            success: true,
            dashboard: {
                doctor: {
                    name: doctor.name,
                    specialization: doctor.specialization,
                    rating: doctor.rating,
                    totalPatients: uniquePatientCount
                },
                statistics: {
                    totalAppointments,
                    todayAppointments,
                    upcomingAppointments
                },
                recentAppointments
            }
        });

    } catch (error) {
        console.error('Get doctor dashboard error:', error);
        res.status(500).json({
            error: 'Failed to get dashboard data',
            message: error.message
        });
    }
};

// Get available time slots for a specific date
const getAvailableSlots = async (req, res) => {
    try {
        const { date } = req.query;
        const doctorId = req.user.id;

        if (!date) {
            return res.status(400).json({
                error: 'Date is required',
                message: 'Please provide a date to check availability'
            });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                error: 'Doctor not found'
            });
        }

        // Get day of week
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        
        // Check if doctor is available on this day
        if (!doctor.availability.days.includes(dayOfWeek)) {
            return res.json({
                success: true,
                availableSlots: []
            });
        }

        // Get booked appointments for this date
        const bookedAppointments = await Appointment.find({
            doctorId,
            appointmentDate: {
                $gte: new Date(date).setHours(0, 0, 0, 0),
                $lt: new Date(date).setHours(23, 59, 59, 999)
            },
            status: { $in: ['scheduled', 'ongoing'] }
        });

        const bookedSlots = bookedAppointments.map(apt => apt.timeSlot);
        const availableSlots = doctor.availability.timeSlots.filter(
            slot => !bookedSlots.includes(slot)
        );

        res.json({
            success: true,
            availableSlots
        });

    } catch (error) {
        console.error('Get available slots error:', error);
        res.status(500).json({
            error: 'Failed to get available slots',
            message: error.message
        });
    }
};

// Get doctor by ID (for public profile)
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const doctor = await Doctor.findById(id)
            .select('-password -__v')
            .lean();
            
        if (!doctor) {
            return res.status(404).json({
                success: false,
                error: 'Doctor not found'
            });
        }
        
        res.json({
            success: true,
            doctor
        });
    } catch (error) {
        console.error('Get doctor by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get doctor details',
            message: error.message
        });
    }
};

module.exports = {
    getDoctorProfile,
    updateDoctorProfile,
    getAllDoctors,
    getDoctorAppointments,
    getDoctorDashboard,
    getAvailableSlots,
    getDoctorById
};
