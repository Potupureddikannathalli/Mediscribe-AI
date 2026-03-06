# Backend Setup Instructions

## ✅ All Tasks Completed!

### What Was Fixed:
1. **Book Appointment Page** - Now uses `getAllDoctors()` to show newly registered doctors
2. **Photo Upload for Doctors** - Added photo upload functionality with preview on profile edit page
3. **Backend API** - Created Node.js/Express backend with all endpoints
4. **Frontend-Backend Connection** - Created API client library for seamless integration

---

## 🚀 Running the Application

### Backend Server (Port 5000)
```bash
cd backend
npm start
```

**Backend runs on:** `http://localhost:5000`

### Frontend Server (Port 3000)
```bash
npm run dev
```

**Frontend runs on:** `http://localhost:3000`

---

## 📡 Backend API Endpoints

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get specific doctor
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor info
- `DELETE /api/doctors/:id` - Delete doctor

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user

### Appointments
- `GET /api/appointments` - Get appointments (filter by patientId, doctorId)
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment

### Consultations
- `GET /api/consultations` - Get consultations
- `POST /api/consultations` - Create consultation record

### File Upload
- `POST /api/upload` - Upload doctor profile photos

---

## 🎨 Technologies Used

### Backend:
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Multer** - File upload handling
- **CORS** - Cross-origin requests
- **UUID** - Unique ID generation

### Frontend:
- **React.js** - UI library
- **Next.js** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

---

## 📝 How to Test Newly Registered Doctors

1. **Register a new doctor:**
   - Go to `/register?role=doctor`
   - Fill in: name, email, password, phone, department, specialization
   - Click "Create Account"

2. **Edit doctor profile (add photo):**
   - Login as the doctor
   - Go to "Edit Profile"
   - Click camera icon on profile picture
   - Upload photo
   - Save changes

3. **Book appointment as patient:**
   - Register/login as patient
   - Browse departments
   - See newly registered doctor in the list
   - Click "Book Appointment"
   - Select date, time, language
   - Confirm booking

---

## 🔧 Environment Variables

Create `.env.local` in root:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 📦 Installation

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

---

## ✨ Features Implemented

✅ Book appointment page now shows newly registered doctors
✅ Doctor profile photo upload with live preview
✅ RESTful API backend with Node.js/Express
✅ Frontend-backend integration via API client
✅ Image upload handling with Multer
✅ CRUD operations for doctors, users, appointments, consultations
✅ Filter support for appointments and consultations

---

## 🎯 Testing the Complete Flow

1. Start backend: `cd backend && npm start`
2. Start frontend: `npm run dev`
3. Register as doctor with profile photo
4. Register as patient
5. Patient can book appointment with newly registered doctor
6. Doctor can view appointments in dashboard

Backend running on port 5000 ✅
Frontend running on port 3000 ✅
