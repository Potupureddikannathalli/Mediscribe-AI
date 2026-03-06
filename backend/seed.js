const mongoose = require('mongoose');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const Consultation = require('./models/Consultation');

const sampleDoctors = [
    {
        name: 'Dr. Sarah Wilson',
        email: 'sarah@mediscribe.com',
        specialization: 'Cardiology',
        bio: 'Expert cardiologist with 15 years of experience in treating heart conditions.',
        experience: 15,
        rate: 150,
        imageUrl: 'https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg',
    },
    {
        name: 'Dr. Michael Chen',
        email: 'michael@mediscribe.com',
        specialization: 'Dermatology',
        bio: 'Specialist in skin care and cosmetic dermatology.',
        experience: 10,
        rate: 120,
        imageUrl: 'https://img.freepik.com/free-photo/smiling-doctor-with-strethoscope-isolated-grey_651396-974.jpg',
    },
    {
        name: 'Dr. Emily Brooks',
        email: 'emily@mediscribe.com',
        specialization: 'Pediatrics',
        bio: 'Compassionate pediatrician dedicated to child health and wellness.',
        experience: 8,
        rate: 100,
        imageUrl: 'https://img.freepik.com/free-photo/pleased-young-female-doctor-wearing-medical-robe-stethoscope-around-neck-standing-with-closed-posture_409827-254.jpg',
    },
    {
        name: 'Dr. James Carter',
        email: 'james@mediscribe.com',
        specialization: 'Orthopedics',
        bio: 'Orthopedic surgeon specializing in sports injuries and joint replacement.',
        experience: 20,
        rate: 200,
        imageUrl: 'https://img.freepik.com/free-photo/portrait-successful-mid-adult-doctor-with-crossed-arms_1262-12865.jpg',
    },
    {
        name: 'Dr. Olivia Parker',
        email: 'olivia@mediscribe.com',
        specialization: 'Neurology',
        bio: 'Neurologist with a focus on migraine and epilepsy treatment.',
        experience: 12,
        rate: 180,
        imageUrl: 'https://img.freepik.com/free-photo/female-doctor-hospital-with-stethoscope_23-2148827775.jpg',
    },
    {
        name: 'Dr. Robert Brown',
        email: 'robert@mediscribe.com',
        specialization: 'General Medicine',
        bio: 'General practitioner providing comprehensive care for all ages.',
        experience: 25,
        rate: 90,
        imageUrl: 'https://img.freepik.com/free-photo/smiling-touching-arms-crossed-room-hospital_1134-799.jpg',
    },
    {
        name: 'Dr. Linda Davis',
        email: 'linda@mediscribe.com',
        specialization: 'Psychiatry',
        bio: 'Psychiatrist specializing in anxiety and depression.',
        experience: 14,
        rate: 160,
        imageUrl: 'https://img.freepik.com/free-photo/medium-shot-scientist-living-lab_23-2150293458.jpg',
    },
    {
        name: 'Dr. William Wilson',
        email: 'william@mediscribe.com',
        specialization: 'Ophthalmology',
        bio: 'Ophthalmologist expert in vision correction and eye surgery.',
        experience: 18,
        rate: 140,
        imageUrl: 'https://img.freepik.com/free-photo/portrait-white-man-isolated_53876-40306.jpg',
    }

];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Doctor.deleteMany({});
        await Appointment.deleteMany({});
        await Consultation.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // Create Users
        const adminUser = new User({
            _id: uuidv4(),
            name: 'Admin User',
            email: 'admin@mediscribe.com',
            password: 'password123', // In a real app, hash this!
            role: 'admin',
            profileImage: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
        });

        const patientUser = new User({
            _id: uuidv4(),
            name: 'John Doe',
            email: 'patient@test.com',
            password: 'password123',
            role: 'patient',
            profileImage: 'https://ui-avatars.com/api/?name=John+Doe&background=random'
        });

        await adminUser.save();
        await patientUser.save();
        console.log('👤 Created Users (Admin, Patient)');

        // Create Doctors
        const createdDoctors = [];
        for (const doc of sampleDoctors) {
            const newDoctor = new Doctor({
                _id: uuidv4(),
                ...doc
            });
            await newDoctor.save();
            createdDoctors.push(newDoctor);
        }
        console.log(`👨‍⚕️ Created ${createdDoctors.length} Doctors`);

        // Create Appointments for the Patient
        const appointments = [
            {
                patientId: patientUser._id,
                doctorId: createdDoctors[0]._id, // Sarah (Cardiology)
                date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
                time: '10:00 AM',
                status: 'confirmed',
                reason: 'Regular heart checkup'
            },
            {
                patientId: patientUser._id,
                doctorId: createdDoctors[1]._id, // Michael (Dermatology)
                date: new Date(new Date().setDate(new Date().getDate() + 3)), // 3 days later
                time: '02:30 PM',
                status: 'pending',
                reason: 'Skin rash consultation'
            },
            {
                patientId: patientUser._id,
                doctorId: createdDoctors[5]._id, // Robert (General Medicine)
                date: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago
                time: '09:00 AM',
                status: 'completed',
                reason: 'Fever and cold'
            }
        ];

        for (const apt of appointments) {
            const newAppointment = new Appointment({
                _id: uuidv4(),
                ...apt
            });
            await newAppointment.save();

            // If completed, create a dummy consultation
            if (apt.status === 'completed') {
                const consultation = new Consultation({
                    _id: uuidv4(),
                    patientId: apt.patientId,
                    doctorId: apt.doctorId,
                    appointmentId: newAppointment._id,
                    transcript: "Patient complained of fever.",
                    doctorNotes: "Viral fever suspected.",
                    prescription: "Paracetamol 500mg",
                    patientSummary: "Rest and hydration.",
                    lifestyleRecommendations: ["Drink water", "Sleep well"]
                });
                await consultation.save();
            }
        }
        console.log(`tj️ Created ${appointments.length} Appointments`);

        console.log('✨ Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding database:', err);
        process.exit(1);
    }
};

seedData();
