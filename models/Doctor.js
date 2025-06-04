const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    specialization: {
        type: String,
        required: [true, 'Specialization is required'],
        enum: [
            'General Medicine',
            'Cardiology',
            'Dermatology',
            'Pediatrics',
            'Orthopedics',
            'Neurology',
            'Psychiatry',
            'Gynecology',
            'ENT',
            'Ophthalmology',
            'Dentistry',
            'Emergency Medicine'
        ]
    },
    experience: {
        type: Number,
        required: [true, 'Experience is required'],
        min: [0, 'Experience cannot be negative'],
        max: [50, 'Experience cannot exceed 50 years']
    },
    qualifications: [{
        type: String,
        trim: true
    }],
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [25, 'Age must be at least 25'],
        max: [80, 'Age cannot exceed 80']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['Male', 'Female', 'Other']
    },
    consultationFee: {
        type: Number,
        required: [true, 'Consultation fee is required'],
        min: [0, 'Fee cannot be negative']
    },
    availability: {
        days: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }],
        timeSlots: [{
            type: String,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM-HH:MM)']
        }]
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    },
    totalPatients: {
        type: Number,
        default: 0,
        min: [0, 'Total patients cannot be negative']
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    profileImage: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Hash password before saving
doctorSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
doctorSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
doctorSchema.methods.toJSON = function() {
    const doctorObject = this.toObject();
    delete doctorObject.password;
    return doctorObject;
};

module.exports = mongoose.model('Doctor', doctorSchema);
