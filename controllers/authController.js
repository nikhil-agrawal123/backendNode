const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');

// Doctor Registration
const registerDoctor = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const {
            name,
            email,
            phone,
            password,
            specialization,
            experience,
            qualifications,
            age,
            gender,
            consultationFee,
            availability
        } = req.body;

        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({
                error: 'Doctor already exists',
                message: 'A doctor with this email already exists'
            });
        }

        // Create new doctor
        const doctor = new Doctor({
            name,
            email,
            phone,
            password,
            specialization,
            experience,
            qualifications: qualifications || [],
            age,
            gender,
            consultationFee,
            availability: availability || { days: [], timeSlots: [] }
        });

        await doctor.save();

        res.status(201).json({
            success: true,
            message: 'Doctor registered successfully',
            user: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                specialization: doctor.specialization,
                role: 'doctor'
            }
        });

    } catch (error) {
        console.error('Doctor registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
};

// Doctor Login (stateless, returns user info if credentials are valid)
const loginDoctor = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find doctor by email
        const doctor = await Doctor.findOne({ email }).select('+password');
        if (!doctor) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Check password
        const isPasswordValid = await doctor.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                specialization: doctor.specialization,
                role: 'doctor'
            }
        });

    } catch (error) {
        console.error('Doctor login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
};

// Patient Registration
const registerPatient = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const {
            name,
            email,
            phone,
            password,
            age,
            gender,
            bloodGroup,
            allergies,
            emergencyContact,
            medicalHistory,
            currentMedications,
        } = req.body;

        // Check if patient already exists
        const existingPatient = await Patient.findOne({ email });
        if (existingPatient) {
            return res.status(400).json({
                error: 'Patient already exists',
                message: 'A patient with this email already exists'
            });
        }

        // Create new patient
        const patient = new Patient({
            name,
            email,
            phone,
            password,
            age,
            gender,
            bloodGroup: bloodGroup || '',
            allergies: allergies || [],
            emergencyContact: emergencyContact || {},
            medicalHistory: medicalHistory || [],
            currentMedications: currentMedications || []
        });

        await patient.save();

        res.status(201).json({
            success: true,
            message: 'Patient registered successfully',
            user: {
                id: patient._id,
                name: patient.name,
                email: patient.email,
                age: patient.age,
                role: 'patient'
            }
        });

    } catch (error) {
        console.error('Patient registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
};

// Patient Login (stateless, returns user info if credentials are valid)
const loginPatient = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find patient by email
        const patient = await Patient.findOne({ email }).select('+password');
        if (!patient) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Check password
        const isPasswordValid = await patient.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: patient._id,
                name: patient.name,
                email: patient.email,
                age: patient.age,
                role: 'patient'
            }
        });

    } catch (error) {
        console.error('Patient login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
};

// Logout (stateless, just returns success)
const logout = (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

// Get current user (stateless version: not supported)
const getCurrentUser = async (req, res) => {
    res.status(400).json({
        error: 'Not supported',
        message: 'Stateless API does not support session-based current user'
    });
};

module.exports = {
    registerDoctor,
    loginDoctor,
    registerPatient,
    loginPatient,
    logout,
    getCurrentUser
};