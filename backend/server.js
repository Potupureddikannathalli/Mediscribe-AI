require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Import Models
const Doctor = require('./models/Doctor');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Consultation = require('./models/Consultation');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:3000'].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'));
    }
  }
});

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  // Options (if needed, mostly default now)
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'MediScribe AI Backend API',
    version: '1.0.0',
    endpoints: {
      doctors: '/api/doctors',
      users: '/api/users',
      appointments: '/api/appointments',
      consultations: '/api/consultations',
      upload: '/api/upload'
    }
  });
});

// --- Auth ---
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    let user;
    if (role === 'doctor') {
      user = await Doctor.findOne({ email });
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // In a real app, compare hashed passwords. Here we simplify as per existing mock logic (or lack thereof).
    // Assuming password was stored or we just check existence for now if no auth logic existed.
    // But the User model has a password field. Let's assume simple string comparison for now as requested "connect data".
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Doctors ---
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (doctor) {
      res.json({ success: true, data: doctor });
    } else {
      res.status(404).json({ success: false, message: 'Doctor not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    console.log('📝 Creating new doctor:', req.body.email);
    const newDoctor = new Doctor(req.body);
    await newDoctor.save();
    res.status(201).json({ success: true, data: newDoctor });
  } catch (err) {
    console.error('❌ Error creating doctor:', err);
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const updatedDoctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedDoctor) {
      res.json({ success: true, data: updatedDoctor });
    } else {
      res.status(404).json({ success: false, message: 'Doctor not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const deletedDoctor = await Doctor.findByIdAndDelete(req.params.id);
    if (deletedDoctor) {
      res.json({ success: true, message: 'Doctor deleted', data: deletedDoctor });
    } else {
      res.status(404).json({ success: false, message: 'Doctor not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Users ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    console.log('📝 Creating new user:', req.body.email);
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    console.error('❌ Error creating user:', err);
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedUser) {
      res.json({ success: true, data: updatedUser });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (deletedUser) {
      res.json({ success: true, message: 'User deleted', data: deletedUser });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Appointments ---
app.get('/api/appointments', async (req, res) => {
  try {
    const { patientId, doctorId } = req.query;
    let query = {};
    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization');

    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    res.status(201).json({ success: true, data: newAppointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const updatedAppointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedAppointment) {
      res.json({ success: true, data: updatedAppointment });
    } else {
      res.status(404).json({ success: false, message: 'Appointment not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/appointments/:id/transcript', async (req, res) => {
  try {
    const { speaker, text, time, language } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $push: { liveTranscript: { speaker, text, time, language } } },
      { new: true }
    );
    if (appointment) {
      res.json({ success: true, data: appointment.liveTranscript });
    } else {
      res.status(404).json({ success: false, message: 'Appointment not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/appointments/:id/chat', async (req, res) => {
  try {
    const { id, sender, message, time, isFile, fileUrl } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $push: { chatMessages: { id, sender, message, time, isFile, fileUrl } } },
      { new: true }
    );
    if (appointment) {
      res.json({ success: true, data: appointment.chatMessages });
    } else {
      res.status(404).json({ success: false, message: 'Appointment not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Consultations ---
app.get('/api/consultations', async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId } = req.query;
    let query = {};
    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (appointmentId) query.appointmentId = appointmentId;

    const consultations = await Consultation.find(query)
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    res.json({ success: true, data: consultations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/consultations', async (req, res) => {
  try {
    const newConsultation = new Consultation(req.body);
    await newConsultation.save();

    // Also mark appointment as completed if related to one
    if (req.body.appointmentId) {
      await Appointment.findByIdAndUpdate(req.body.appointmentId, { status: 'completed' });
    }

    res.status(201).json({ success: true, data: newConsultation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Uploads ---
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const baseUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      filename: req.file.filename,
      url: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// --- AI Generation ---
app.post('/api/generate-reports', async (req, res) => {
  try {
    const { transcript, patientName, language } = req.body;

    if (!transcript || transcript.trim().length < 10) {
      return res.json({
        success: true,
        data: {
          doctorNotes: "No consultation data captured during this session.",
          prescription: "No medications discussed.",
          patientSummary: "No specific medical discussion was recorded in this session.",
          lifestyleRecommendations: []
        }
      });
    }

    const systemPrompt = `You are an expert AI medical scribe. Your task is to analyze the doctor-patient consultation transcript and generate structured medical documentation.
    
    CRITICAL RULES:
    1. STRICT ADHERENCE: Only include symptoms, diagnosis, medications, and advice that were EXPLICITLY mentioned in the transcript.
    2. NO HALLUCINATIONS: Do NOT assume or add any information (like medical history, symptoms, or medications) that was not discussed.
    3. DATA CAPTURE: If a section has no data in the transcript, explicitly state "None mentioned" or "No data available from transcript."
    4. TONALITY: Professional for doctor notes, clear and empathetic for patient summary.
    5. FORMATTING: Return a JSON object where "doctorNotes", "prescription", and "patientSummary" are STRINGS, not objects.

    Patient Name: ${patientName}
    Output Language: ${language} (Ensure all content is in this language)

    JSON FIELDS TO RETURN:
    - "doctorNotes": A single string containing professional SOAP notes (Subjective, Objective, Assessment, Plan) with clear headers.
    - "prescription": A single string listing medicines mentioned with dosage. Otherwise "No medications prescribed."
    - "patientSummary": A single string providing a simple summary of what was discussed.
    - "lifestyleRecommendations": An array of specific strings (tips explicitly mentioned). Return an empty array [] if none.`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcript:\n${transcript}` }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Ensure the results are strings even if AI ignored the formatting instruction
    if (typeof result.doctorNotes === 'object') {
      result.doctorNotes = Object.entries(result.doctorNotes)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }
    if (typeof result.prescription === 'object') {
      result.prescription = JSON.stringify(result.prescription, null, 2);
    }
    if (typeof result.patientSummary === 'object') {
      result.patientSummary = JSON.stringify(result.patientSummary, null, 2);
    }

    res.json({ success: true, data: result });

  } catch (error) {
    console.error('❌ OpenAI API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate report',
      details: error.response ? error.response.data : null
    });
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ MediScribe Backend Server running on http://localhost:${PORT}`);
  console.log(`🔑 OpenAI API Key Status: ${process.env.OPENAI_API_KEY ? 'Loaded ✅' : 'Missing ❌'}`);
  console.log(`📋 API Documentation: http://localhost:${PORT}`);
});
