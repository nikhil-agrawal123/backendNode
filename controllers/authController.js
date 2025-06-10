const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');

// Doctor Registration
const registerDoctor = async (req, res) => {
    try {
        // Check for validation errors
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

        // Create session
        req.session.user = {
            id: doctor._id,
            email: doctor.email,
            name: doctor.name,
            role: 'doctor'
        };

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

// Doctor Login
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

        // Create session
        req.session.user = {
            id: doctor._id,
            email: doctor.email,
            name: doctor.name,
            role: 'doctor'
        };

        req.session.save(err => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({
                    error: 'Login failed',
                    message: 'Failed to create session'
                });
            }
            console.log("DOCTOR SESSION SAVED:", req.session);
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
            medicalHistory: medicalHistory, // Add this line
            currentMedications: currentMedications, // Add this line
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
            medicalHistory: medicalHistory || [], // Add this line
            currentMedications: currentMedications || [] // Add this line
        });

        await patient.save();

        // Create session
        req.session.user = {
            id: patient._id,
            email: patient.email,
            name: patient.name,
            role: 'patient'
        };

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

// Patient Login
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

        // Create session
        req.session.user = {
            id: patient._id,
            email: patient.email,
            name: patient.name,
            role: 'patient'
        };

        // ADD THIS: Force session save before responding
        req.session.save(err => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({
                    error: 'Login failed',
                    message: 'Failed to create session'
                });
            }
            console.log("SESSION SAVED SUCCESSFULLY:", req.session);
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
        });

    } catch (error) {
        console.error('Patient login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
};

// Logout
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                error: 'Logout failed',
                message: 'Could not log out, please try again'
            });
        }
        
        res.clearCookie('healthcare.sid');
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
};

// Get current user
const getCurrentUser = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                error: 'Not authenticated',
                message: 'Please login first'
            });
        }

        const { id, role } = req.session.user;
        let user;

        if (role === 'doctor') {
            user = await Doctor.findById(id);
        } else if (role === 'patient') {
            user = await Patient.findById(id);
        }

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }

        res.json({
            success: true,
            user: {
                ...user.toJSON(),
                role
            }
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            error: 'Failed to get user',
            message: error.message
        });
    }
};

module.exports = {
    registerDoctor,
    loginDoctor,
    registerPatient,
    loginPatient,
    logout,
    getCurrentUser
};
