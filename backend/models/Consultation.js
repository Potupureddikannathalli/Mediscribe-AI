const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    appointmentId: {
        type: String,
        required: true
    },
    patientId: {
        type: String,
        required: true
    },
    doctorId: {
        type: String,
        required: true
    },
    doctorNotes: {
        type: String
    },
    prescription: {
        type: String // Can be JSON string or structured object if preferred
    },
    patientSummary: {
        type: String
    },
    lifestyleRecommendations: {
        type: Array
    },
    transcript: {
        type: String
    },
    translatedTranscript: {
        type: String
    },
    chatMessagesHistory: [{
        id: String,
        sender: String,
        message: String,
        translatedMessage: String,
        time: String,
        isFile: Boolean,
        fileUrl: String
    }],
    audioUrl: {
        type: String
    },
    pdfUrl: {
        type: String
    },
    isSentToPatient: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Consultation', ConsultationSchema);
