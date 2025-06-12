const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Doctor ID is required']
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient ID is required']
    },
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required'],
        validate: {
            validator: function(date) {
                return date > new Date();
            },
            message: 'Appointment date must be in the future'
        }
    },
    timeSlot: {
        type: String,
        required: [true, 'Time slot is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM-HH:MM)']
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },
    consultationType: {
        type: String,
        enum: ['video', 'audio', 'chat'],
        default: 'video'
    },
    symptoms: {
        type: String,
        trim: true,
        maxlength: [500, 'Symptoms description cannot exceed 500 characters']
    },
    diagnosis: {
        type: String,
        trim: true,
        maxlength: [1000, 'Diagnosis cannot exceed 1000 characters']
    },
    prescription: {
        medications: [{
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
            },
            duration: {
                type: String,
                trim: true
            }
        }],
        instructions: {
            type: String,
            trim: true,
            maxlength: [500, 'Instructions cannot exceed 500 characters']
        }
    },
    roomId: {
    type: String,
    trim: true,
},
    meetingLink: {
        type: String,
        trim: true
    },
    meetingId: {
        type: String,
        trim: true
    },
    whatsappSent: {
        type: Boolean,
        default: false
    },
    reminderSent: {
        type: Boolean,
        default: false
    },
    consultationNotes: {
        type: String,
        trim: true,
        maxlength: [2000, 'Consultation notes cannot exceed 2000 characters']
    },
    rating: {
        score: {
            type: Number,
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5']
        },
        feedback: {
            type: String,
            trim: true,
            maxlength: [500, 'Feedback cannot exceed 500 characters']
        }
    }
}, {
    timestamps: true
});

// Index for efficient queries
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });

// Generate meeting link before saving
appointmentSchema.pre('save', function(next) {
    if (this.isNew && !this.meetingLink) {
        this.meetingId = `HealthChat-${this._id}-${Date.now()}`;
        this.meetingLink = `https://health-chat-nexus.vercel.app/video-conference/${this.meetingId}`;
    }
    next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
