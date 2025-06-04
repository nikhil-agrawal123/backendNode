// Video service for managing Jitsi Meet integration

// Generate unique meeting room ID
const generateMeetingRoom = (appointmentId, doctorId, patientId) => {
    const timestamp = Date.now();
    const roomId = `HealthChat-${appointmentId}-${timestamp}`;
    return roomId;
};

// Generate Jitsi Meet URL
const generateMeetingLink = (roomId) => {
    return `https://meet.jit.si/${roomId}`;
};

// Generate meeting configuration for frontend
const generateMeetingConfig = (appointmentId, userRole, userName) => {
    const roomId = `HealthChat-${appointmentId}`;
    
    return {
        roomName: roomId,
        domain: 'meet.jit.si',
        options: {
            width: '100%',
            height: 600,
            configOverwrite: {
                startWithAudioMuted: userRole === 'patient', // Patients start muted
                startWithVideoMuted: false,
                enableWelcomePage: false,
                enableClosePage: false,
                prejoinPageEnabled: false,
                disableInviteFunctions: true,
                disableAddingBackgroundImages: true,
                enableEmailInStats: false,
                enableDisplayNameInStats: false,
                enableInsecureRoomNameWarning: false,
                doNotStoreRoom: true
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop',
                    'fullscreen', 'fodeviceselection', 'hangup', 'profile',
                    'chat', 'recording', 'livestreaming', 'etherpad',
                    'sharedvideo', 'settings', 'raisehand', 'videoquality',
                    'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help',
                    'mute-everyone'
                ],
                SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                SHOW_BRAND_WATERMARK: false,
                BRAND_WATERMARK_LINK: '',
                SHOW_POWERED_BY: false,
                SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                SHOW_CHROME_EXTENSION_BANNER: false,
                MOBILE_APP_PROMO: false,
                MAXIMUM_ZOOMING_COEFFICIENT: 1.3,
                DISABLE_PRESENCE_STATUS: true,
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: false
            },
            userInfo: {
                displayName: userName,
                email: ''
            }
        }
    };
};

// Validate meeting room access
const validateMeetingAccess = (appointmentId, userId, userRole) => {
    // This would typically check database to ensure user has access to this meeting
    // For now, we'll return true as validation is handled by appointment endpoints
    return true;
};

// Generate meeting statistics
const getMeetingStats = (appointmentId) => {
    // This would integrate with Jitsi Meet API to get meeting statistics
    // For hackathon purposes, we'll return mock data
    return {
        appointmentId,
        duration: 0,
        participants: [],
        startTime: null,
        endTime: null,
        recordingAvailable: false
    };
};

// Meeting room utilities
const createMeetingRoom = (appointment) => {
    const roomId = generateMeetingRoom(
        appointment._id,
        appointment.doctorId,
        appointment.patientId
    );
    
    const meetingLink = generateMeetingLink(roomId);
    
    return {
        roomId,
        meetingLink,
        domain: 'meet.jit.si'
    };
};

// Pre-meeting checks
const preMeetingChecks = () => {
    return {
        browserSupported: true, // Jitsi works on all modern browsers
        cameraAccess: 'required',
        microphoneAccess: 'required',
        internetConnection: 'required',
        recommendations: [
            'Use Chrome or Firefox for best experience',
            'Ensure stable internet connection',
            'Test camera and microphone before joining',
            'Join from a quiet environment',
            'Have good lighting for video'
        ]
    };
};

// Meeting room features
const getMeetingFeatures = () => {
    return {
        videoCall: true,
        audioCall: true,
        screenSharing: true,
        chat: true,
        recording: false, // Disabled for privacy
        backgroundBlur: true,
        virtualBackground: false,
        breakoutRooms: false,
        whiteboard: false,
        fileSharing: false,
        maxParticipants: 2 // Doctor + Patient only
    };
};

module.exports = {
    generateMeetingRoom,
    generateMeetingLink,
    generateMeetingConfig,
    validateMeetingAccess,
    getMeetingStats,
    createMeetingRoom,
    preMeetingChecks,
    getMeetingFeatures
};
