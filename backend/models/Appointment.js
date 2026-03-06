const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    _id: {
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
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    reason: {
        type: String
    },
    doctorName: {
        type: String
    },
    patientName: {
        type: String
    },
    department: {
        type: String
    },
    videoCallStarted: {
        type: Boolean,
        default: false
    },
    videoCallStartedAt: {
        type: Date
    },
    liveTranscript: [{
        speaker: String,
        text: String,
        time: String,
        language: String
    }],
    chatMessages: [{
        id: String,
        sender: String,
        message: String,
        time: String,
        isFile: Boolean,
        fileUrl: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });


module.exports = mongoose.model('Appointment', AppointmentSchema);
