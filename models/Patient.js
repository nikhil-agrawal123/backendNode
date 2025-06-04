const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
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
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [1, 'Age must be at least 1'],
        max: [120, 'Age cannot exceed 120']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['Male', 'Female', 'Other']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        default: ''
    },
    medicalHistory: [{
        condition: {
            type: String,
            trim: true
        },
        diagnosedDate: {
            type: Date
        },
        status: {
            type: String,
            enum: ['Active', 'Resolved', 'Chronic'],
            default: 'Active'
        }
    }],
    allergies: [{
        type: String,
        trim: true
    }],
    currentMedications: [{
        name: {
            type: String,
            trim: true
        },
        dosage: {
            type: String,
            trim: true
        },
        frequency: {
            type: String,
            trim: true
        }
    }],
    emergencyContact: {
        name: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        relation: {
            type: String,
            trim: true
        }
    },
    profileImage: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Hash password before saving
patientSchema.pre('save', async function(next) {
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
patientSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
patientSchema.methods.toJSON = function() {
    const patientObject = this.toObject();
    delete patientObject.password;
    return patientObject;
};

module.exports = mongoose.model('Patient', patientSchema);
