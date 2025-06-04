const fetch = require('node-fetch');

// Send appointment confirmation via WhatsApp
const sendAppointmentConfirmation = async (phone, doctorName, date, time, meetingLink) => {
    try {
        const message = `🏥 *Healthcare Appointment Confirmed!*

👨‍⚕️ *Doctor:* Dr. ${doctorName}
📅 *Date:* ${new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}
⏰ *Time:* ${time}
💻 *Consultation Type:* Video Call

🔗 *Join Meeting:* ${meetingLink}

📝 *Instructions:*
- Join the meeting 5 minutes before your appointment
- Ensure you have a stable internet connection
- Keep your medical documents ready

Thank you for choosing our healthcare platform! 🙏`;

        const apiKey = process.env.CALLMEBOT_API_KEY;
        if (!apiKey) {
            throw new Error('CallMeBot API key not configured');
        }

        // Format phone number (remove any non-digits and add country code if needed)
        const formattedPhone = phone.replace(/\D/g, '');
        
        const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${response.status}`);
        }

        console.log(`✅ WhatsApp confirmation sent to ${phone}`);
        return true;

    } catch (error) {
        console.error('❌ WhatsApp notification failed:', error.message);
        throw error;
    }
};

// Send appointment reminder
const sendAppointmentReminder = async (phone, doctorName, date, time, meetingLink) => {
    try {
        const message = `⏰ *Appointment Reminder*

Your appointment with Dr. ${doctorName} is tomorrow!

📅 *Date:* ${new Date(date).toLocaleDateString()}
⏰ *Time:* ${time}
🔗 *Meeting Link:* ${meetingLink}

Please be ready 5 minutes before your scheduled time. 

See you soon! 👋`;

        const apiKey = process.env.CALLMEBOT_API_KEY;
        const formattedPhone = phone.replace(/\D/g, '');
        
        const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${response.status}`);
        }

        console.log(`✅ WhatsApp reminder sent to ${phone}`);
        return true;

    } catch (error) {
        console.error('❌ WhatsApp reminder failed:', error.message);
        throw error;
    }
};

// Send appointment cancellation notification
const sendAppointmentCancellation = async (phone, doctorName, date, time, reason = '') => {
    try {
        const message = `❌ *Appointment Cancelled*

Your appointment with Dr. ${doctorName} has been cancelled.

📅 *Date:* ${new Date(date).toLocaleDateString()}
⏰ *Time:* ${time}
${reason ? `📝 *Reason:* ${reason}` : ''}

Please book a new appointment if needed.

Thank you for your understanding. 🙏`;

        const apiKey = process.env.CALLMEBOT_API_KEY;
        const formattedPhone = phone.replace(/\D/g, '');
        
        const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${response.status}`);
        }

        console.log(`✅ WhatsApp cancellation sent to ${phone}`);
        return true;

    } catch (error) {
        console.error('❌ WhatsApp cancellation failed:', error.message);
        throw error;
    }
};

// Send meeting link
const sendMeetingLink = async (phone, doctorName, meetingLink) => {
    try {
        const message = `🔗 *Meeting Link Ready*

Dr. ${doctorName} is ready for your consultation.

💻 *Join Now:* ${meetingLink}

Click the link to join your video consultation. 👨‍⚕️`;

        const apiKey = process.env.CALLMEBOT_API_KEY;
        const formattedPhone = phone.replace(/\D/g, '');
        
        const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${response.status}`);
        }

        console.log(`✅ WhatsApp meeting link sent to ${phone}`);
        return true;

    } catch (error) {
        console.error('❌ WhatsApp meeting link failed:', error.message);
        throw error;
    }
};

module.exports = {
    sendAppointmentConfirmation,
    sendAppointmentReminder,
    sendAppointmentCancellation,
    sendMeetingLink
};
