const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import configurations
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');

const app = express();

connectDB();
app.use(cors({
    origin: 'https://health-chat-nexus.vercel.app'
    // credentials: true, // REMOVE this line
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REMOVE session configuration

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Healthcare API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: import.meta.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = import.meta.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Healthcare server running on port ${PORT}`);
    console.log(`🏥 API Base URL: http://localhost:${PORT}/api`);
});