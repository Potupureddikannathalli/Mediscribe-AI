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
    audioUrl: {
        type: String
    },
    pdfUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Consultation', ConsultationSchema);
