require('dotenv').config();
const mongoose = require('mongoose');

// Import Models
const Doctor = require('./models/Doctor');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Consultation = require('./models/Consultation');

const clearDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected for Cleanup');

        await Doctor.deleteMany({});
        console.log('🗑️  Doctors deleted');

        await User.deleteMany({});
        console.log('🗑️  Users deleted');

        await Appointment.deleteMany({});
        console.log('🗑️  Appointments deleted');

        await Consultation.deleteMany({});
        console.log('🗑️  Consultations deleted');

        console.log('✨ Database Cleared Successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error clearing database:', err);
        process.exit(1);
    }
};

clearDatabase();
