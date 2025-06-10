const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');
const { sendAppointmentConfirmation } = require('../services/whatsappService');

// Book appointment (stateless: patientId must be in req.body)
const bookAppointment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const {
            doctorId,
            patientId,
            appointmentDate,
            timeSlot,
            symptoms,
            consultationType = 'video'
        } = req.body;

        // Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                error: 'Doctor not found',
                message: 'Selected doctor not found'
            });
        }

        // Check if patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                error: 'Patient not found',
                message: 'Patient profile not found'
            });
        }

        // Check if appointment date is in the future
        const appointmentDateTime = new Date(appointmentDate);
        if (appointmentDateTime <= new Date()) {
            return res.status(400).json({
                error: 'Invalid date',
                message: 'Appointment date must be in the future'
            });
        }

        // Check if time slot is available
        const existingAppointment = await Appointment.findOne({
            doctorId,
            appointmentDate: {
                $gte: new Date(appointmentDate).setHours(0, 0, 0, 0),
                $lt: new Date(appointmentDate).setHours(23, 59, 59, 999)
            },
            timeSlot,
            status: { $in: ['scheduled', 'ongoing'] }
        });

        if (existingAppointment) {
            return res.status(400).json({
                error: 'Time slot not available',
                message: 'This time slot is already booked'
            });
        }

        // Check if patient already has an appointment at this time
        const existingPatientAppointment = await Appointment.findOne({
            patientId,
            appointmentDate: {
                $gte: new Date(appointmentDate).setHours(0, 0, 0, 0),
                $lt: new Date(appointmentDate).setHours(23, 59, 59, 999)
            },
            timeSlot,
            status: { $in: ['scheduled', 'ongoing', 'confirmed'] }
        });

        if (existingPatientAppointment) {
            return res.status(400).json({
                error: 'Conflicting appointment',
                message: 'You already have another appointment scheduled at this time'
            });
        }

        // Create appointment
        const appointment = new Appointment({
            doctorId,
            patientId,
            appointmentDate: appointmentDateTime,
            timeSlot,
            symptoms,
            consultationType,
            status: 'scheduled'
        });

        await appointment.save();

        // Populate appointment with doctor and patient details
        await appointment.populate([
            { path: 'doctorId', select: 'name specialization consultationFee' },
            { path: 'patientId', select: 'name email phone' }
        ]);

        // Send WhatsApp confirmation
        try {
            await sendAppointmentConfirmation(
                patient.phone,
                doctor.name,
                appointmentDate,
                timeSlot,
                appointment.meetingLink
            );
            appointment.whatsappSent = true;
            await appointment.save();
        } catch (whatsappError) {
            console.error('WhatsApp notification failed:', whatsappError);
        }

        // Update doctor's total patients count
        await Doctor.findByIdAndUpdate(doctorId, {
            $inc: { totalPatients: 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            appointment
        });

    } catch (error) {
        console.error('Book appointment error:', error);
        res.status(500).json({
            error: 'Failed to book appointment',
            message: error.message
        });
    }
};

// Get appointment details (stateless: patientId or doctorId must be in query/body)
const getAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { patientId, doctorId } = req.query;

        const appointment = await Appointment.findById(appointmentId)
            .populate('doctorId', 'name email phone specialization consultationFee')
            .populate('patientId', 'name email phone age gender');

        if (!appointment) {
            return res.status(404).json({
                error: 'Appointment not found',
                message: 'Appointment not found'
            });
        }

        // Only allow access if patientId or doctorId matches
        if (
            (patientId && appointment.patientId._id.toString() !== patientId) &&
            (doctorId && appointment.doctorId._id.toString() !== doctorId)
        ) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have permission to view this appointment'
            });
        }

        res.json({
            success: true,
            appointment
        });

    } catch (error) {
        console.error('Get appointment error:', error);
        res.status(500).json({
            error: 'Failed to get appointment',
            message: error.message
        });
    }
};

// Update appointment (stateless: patientId or doctorId must be in body)
const updateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { patientId, doctorId, ...updateFields } = req.body;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                error: 'Appointment not found',
                message: 'Appointment not found'
            });
        }

        // Only allow update if patientId or doctorId matches
        if (
            (patientId && appointment.patientId.toString() !== patientId) &&
            (doctorId && appointment.doctorId.toString() !== doctorId)
        ) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have permission to update this appointment'
            });
        }

        // Allow all fields for now (or restrict as needed)
        Object.assign(appointment, updateFields);
        await appointment.save();

        res.json({
            success: true,
            message: 'Appointment updated successfully',
            appointment
        });

    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({
            error: 'Failed to update appointment',
            message: error.message
        });
    }
};

// Cancel appointment (stateless: patientId or doctorId must be in body)
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { patientId, doctorId } = req.body;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                error: 'Appointment not found',
                message: 'Appointment not found'
            });
        }

        // Only allow cancel if patientId or doctorId matches
        if (
            (patientId && appointment.patientId.toString() !== patientId) &&
            (doctorId && appointment.doctorId.toString() !== doctorId)
        ) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have permission to cancel this appointment'
            });
        }

        if (appointment.status === 'completed' || appointment.status === 'cancelled') {
            return res.status(400).json({
                error: 'Cannot cancel appointment',
                message: `Appointment is already ${appointment.status}`
            });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            appointment
        });

    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({
            error: 'Failed to cancel appointment',
            message: error.message
        });
    }
};

// Rate appointment (stateless: patientId must be in body)
const rateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { score, feedback, patientId } = req.body;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                error: 'Appointment not found'
            });
        }

        if (appointment.patientId.toString() !== patientId) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only rate your own appointments'
            });
        }

        if (appointment.status !== 'completed') {
            return res.status(400).json({
                error: 'Cannot rate appointment',
                message: 'You can only rate completed appointments'
            });
        }

        // Update appointment rating
        appointment.rating = { score, feedback };
        await appointment.save();

        // Update doctor's overall rating
        const doctorAppointments = await Appointment.find({
            doctorId: appointment.doctorId,
            status: 'completed',
            'rating.score': { $exists: true }
        });

        const totalRatings = doctorAppointments.length;
        const averageRating = doctorAppointments.reduce((sum, apt) => sum + apt.rating.score, 0) / totalRatings;

        await Doctor.findByIdAndUpdate(appointment.doctorId, {
            rating: Math.round(averageRating * 10) / 10
        });

        res.json({
            success: true,
            message: 'Rating submitted successfully',
            appointment
        });

    } catch (error) {
        console.error('Rate appointment error:', error);
        res.status(500).json({
            error: 'Failed to rate appointment',
            message: error.message
        });
    }
};

// Get appointment statistics (stateless: patientId or doctorId must be in query)
const getAppointmentStats = async (req, res) => {
    try {
        const { patientId, doctorId } = req.query;

        const query = doctorId
            ? { doctorId }
            : { patientId };

        const stats = await Appointment.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            total: 0,
            scheduled: 0,
            completed: 0,
            cancelled: 0,
            ongoing: 0,
            'no-show': 0
        };

        stats.forEach(stat => {
            formattedStats[stat._id] = stat.count;
            formattedStats.total += stat.count;
        });

        res.json({
            success: true,
            stats: formattedStats
        });

    } catch (error) {
        console.error('Get appointment stats error:', error);
        res.status(500).json({
            error: 'Failed to get appointment statistics',
            message: error.message
        });
    }
};

// Get appointments by doctor ID (public route, doctorId in params)
const getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        const { status, page = 1, limit = 10 } = req.query;

        const query = { doctorId };
        if (status) {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name email phone age gender profileImage')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ appointmentDate: 1, timeSlot: 1 });

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
            error: 'Failed to get doctor appointments',
            message: error.message
        });
    }
};

// ...other public routes remain unchanged...

module.exports = {
    bookAppointment,
    getAppointment,
    updateAppointment,
    cancelAppointment,
    rateAppointment,
    getAppointmentStats,
    getDoctorAppointments,
    getAllDoctors,
    getDoctorById,
    getAvailableSlots,
    updateAppointmentStatus,
    rescheduleAppointment
};