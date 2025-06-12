const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');
const { sendAppointmentConfirmation } = require('../services/whatsappService');
const mongoose = require('mongoose');

// Book appointment
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
            appointmentDate,
            timeSlot,
            symptoms,
            consultationType = 'video',
            roomId
        } = req.body;

        const patientId = req.user.id;

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

        const existingAppointments = await Appointment.findOne({
                doctorId,
                patientId
            });

            // Only increment totalPatients if it's a new patient
            if (!existingAppointments) {
                await Doctor.findByIdAndUpdate(doctorId, {
                    $inc: { totalPatients: 1 }
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
            status: 'scheduled',
            roomId
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
            // Don't fail the appointment booking if WhatsApp fails
        }

        

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

// Get appointment details
const getAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const appointment = await Appointment.findById(appointmentId)
            .populate('doctorId', 'name email phone specialization consultationFee')
            .populate('patientId', 'name email phone age gender');

        if (!appointment) {
            return res.status(404).json({
                error: 'Appointment not found',
                message: 'Appointment not found'
            });
        }

        // Check if user has permission to view this appointment
        const hasPermission = (userRole === 'doctor' && appointment.doctorId._id.toString() === userId) ||
                             (userRole === 'patient' && appointment.patientId._id.toString() === userId);

        if (!hasPermission) {
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

// Update appointment
const updateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                error: 'Appointment not found',
                message: 'Appointment not found'
            });
        }

        // Check permissions
        const hasPermission = (userRole === 'doctor' && appointment.doctorId.toString() === userId) ||
                             (userRole === 'patient' && appointment.patientId.toString() === userId);

        if (!hasPermission) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have permission to update this appointment'
            });
        }

        const allowedUpdates = userRole === 'doctor' 
            ? ['status', 'diagnosis', 'prescription', 'consultationNotes']
            : ['symptoms'];

        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            updates,
            { new: true, runValidators: true }
        ).populate([
            { path: 'doctorId', select: 'name specialization' },
            { path: 'patientId', select: 'name email phone' }
        ]);

        res.json({
            success: true,
            message: 'Appointment updated successfully',
            appointment: updatedAppointment
        });

    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({
            error: 'Failed to update appointment',
            message: error.message
        });
    }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                error: 'Appointment not found',
                message: 'Appointment not found'
            });
        }

        // Check permissions
        const hasPermission = (userRole === 'doctor' && appointment.doctorId.toString() === userId) ||
                             (userRole === 'patient' && appointment.patientId.toString() === userId);

        if (!hasPermission) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have permission to cancel this appointment'
            });
        }

        // Check if appointment can be cancelled
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

// Rate appointment (for patients)
const rateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { score, feedback } = req.body;
        const patientId = req.user.id;

        if (req.user.role !== 'patient') {
            return res.status(403).json({
                error: 'Access denied',
                message: 'Only patients can rate appointments'
            });
        }

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
            rating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
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

// Get appointment statistics
const getAppointmentStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        const query = userRole === 'doctor' 
            ? { doctorId: userId }
            : { patientId: userId };

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
// Get appointments by doctor ID (public route)
const getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.user.id;
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

// Get all doctors (public route)
const getAllDoctors = async (req, res) => {
    try {
        const { specialization, page = 1, limit = 10 } = req.query;
        
        const query = {};
        if (specialization) {
            query.specialization = specialization;
        }

        const doctors = await Doctor.find(query)
            .select('-password -__v')
            .limit(limit * 1)
            .skip((page - 1) * limit);

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

// Get doctor by ID (public route)
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const doctor = await Doctor.findById(id)
            .select('-password -__v');
            
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
            error: 'Failed to get doctor details',
            message: error.message
        });
    }
};

// Get available slots for a doctor by date
const getAvailableSlots = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({
                error: 'Date is required',
                message: 'Please provide a date to check availability'
            });
        }

        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(404).json({
                error: 'Doctor not found'
            });
        }

        // Get day of week
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        
        // Check if doctor works on this day
        if (!doctor.availability.days.includes(dayOfWeek)) {
            return res.json({
                success: true,
                availableSlots: []
            });
        }

        // Get booked appointments for this date
        const bookedAppointments = await Appointment.find({
            doctorId: id,
            appointmentDate: {
                $gte: new Date(date).setHours(0, 0, 0, 0),
                $lt: new Date(date).setHours(23, 59, 59, 999)
            },
            status: { $in: ['scheduled', 'confirmed', 'ongoing'] }
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

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }
        
        // Check if doctor owns this appointment
        if (appointment.doctorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized',
                message: 'You cannot modify this appointment'
            });
        }
        
        appointment.status = status;
        await appointment.save();
        
        res.json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error('Update appointment status error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
};

// Reschedule appointment
const rescheduleAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { appointmentDate, timeSlot } = req.body;
        
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }
        
        // Check authorization (either doctor or patient can reschedule)
        const isDoctor = appointment.doctorId.toString() === req.user.id;
        const isPatient = appointment.patientId.toString() === req.user.id;
        
        if (!isDoctor && !isPatient) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized',
                message: 'You cannot modify this appointment'
            });
        }
        
        // Update appointment
        appointment.appointmentDate = appointmentDate;
        appointment.timeSlot = timeSlot;
        appointment.lastModified = Date.now();
        
        await appointment.save();
        
        res.json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error('Reschedule appointment error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
};

const addPrescription = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { medications, instructions } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment ID'
            });
        }
        
        // Use findByIdAndUpdate instead of findById+save to bypass validation
        const result = await Appointment.findByIdAndUpdate(
            appointmentId,
            { 
                prescription: {
                    medications,
                    instructions
                }
            },
            { 
                new: true,          // Return the updated document
                runValidators: false // Skip validation to allow past dates
            }
        );
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Prescription added successfully',
            prescription: result.prescription
        });
    } catch (error) {
        console.error('Add prescription error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Add these to the module.exports
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
    rescheduleAppointment,
    addPrescription
};