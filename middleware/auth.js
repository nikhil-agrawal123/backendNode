// Authentication middleware for session-based auth
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    } else {
        return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Please login to access this resource'
        });
    }
};

// Check if user is a doctor
const requireDoctor = (req, res, next) => {
    // Debug to see what's in the session
    console.log("DOCTOR SESSION DATA:", req.session);
    
    if (!req.session || !req.session.user) {
        return res.status(401).json({ 
            error: 'Authentication required', 
            message: 'Please login first' 
        });
    }
    
    if (req.session.user.role !== 'doctor') {
        return res.status(403).json({ 
            error: 'Doctor access required', 
            message: 'This resource is only accessible to doctors' 
        });
    }
    
    // Add this check to prevent the error
    if (!req.session.user.id) {
        console.log("WARNING: Session user missing ID:", req.session.user);
        return res.status(400).json({
            error: 'Invalid session',
            message: 'Session is missing required user ID'
        });
    }
    
    // Make sure to set req.user
    req.user = req.session.user;
    next();
};

// Check if user is a patient
const requirePatient = (req, res, next) => {
    // DEBUG - Add this line
    console.log("SESSION DATA:", req.session);
    
    if (!req.session || !req.session.user) {
        return res.status(401).json({ 
            error: 'Authentication required', 
            message: 'Please login first' 
        });
    }
    
    if (req.session.user.role !== 'patient') {
        return res.status(403).json({ 
            error: 'Patient access required', 
            message: 'This resource is only accessible to patients' 
        });
    }
    
    // Add this check to prevent the undefined error
    if (!req.session.user.id) {
        return res.status(400).json({
            error: 'Invalid session',
            message: 'Session is missing required data'
        });
    }
    
    req.user = req.session.user;
    next();
};

// Optional auth - doesn't fail if not authenticated
const optionalAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
    }
    next();
};

module.exports = {
    requireAuth,
    requireDoctor,
    requirePatient,
    optionalAuth
};
