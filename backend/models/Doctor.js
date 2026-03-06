const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['doctor'],
        default: 'doctor'
    },
    specialization: {
        type: String,
        required: true
    },
    bio: {
        type: String
    },
    imageUrl: {
        type: String
    },
    departmentId: {
        type: String
    },
    availableSlots: {
        type: [String],
        default: []
    },
    phone: {
        type: String
    },
    experience: {
        type: Number
    },
    rating: {
        type: Number,
        default: 5.0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });


module.exports = mongoose.model('Doctor', DoctorSchema);