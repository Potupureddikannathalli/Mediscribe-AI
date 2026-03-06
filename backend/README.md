# MediScribe AI Backend API

Simple Node.js/Express backend for MediScribe AI medical application.

## Technologies
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **Body-parser** - Request body parsing

## Installation

```bash
cd backend
npm install
```

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user

### Appointments
- `GET /api/appointments` - Get all appointments (supports query params: patientId, doctorId)
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment

### Consultations
- `GET /api/consultations` - Get consultations (supports query params: patientId, doctorId, appointmentId)
- `POST /api/consultations` - Create consultation

### File Upload
- `POST /api/upload` - Upload image file (returns URL)

## Example Requests

**Upload Doctor Photo:**
```javascript
const formData = new FormData();
formData.append('image', file);

fetch('http://localhost:5000/api/upload', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => console.log(data.data.url));
```

**Create Doctor:**
```javascript
fetch('http://localhost:5000/api/doctors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Dr. John Doe',
    email: 'john@example.com',
    specialization: 'Cardiologist',
    departmentId: '2',
    experience: 10,
    rating: 4.8,
    profileImage: 'http://localhost:5000/uploads/photo.jpg',
    availableSlots: ['09:00', '10:00', '11:00']
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## File Upload Limits
- Max file size: 5MB
- Allowed formats: JPEG, JPG, PNG, GIF

## Data Storage
Currently uses in-memory storage (data resets on server restart). For production, connect to a database like MongoDB, PostgreSQL, or MySQL.
