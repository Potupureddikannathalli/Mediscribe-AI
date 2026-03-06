"use client";

export type UserRole = "patient" | "doctor" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  specialization?: string;
  department?: string;
  profileImage?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  departmentId: string;
  experience: number;
  rating: number;
  profileImage: string;
  availableSlots: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  language?: string;
  status: "pending" | "accepted" | "scheduled" | "completed" | "cancelled";
  consultationStarted: boolean;
  videoCallStarted: boolean;
  videoCallStartedAt?: string;
  liveTranscript?: Array<{
    speaker: string;
    text: string;
    time: string;
    language?: string;
  }>;
  chatMessages?: Array<{
    id: string;
    sender: string;
    message: string;
    time: string;
    isFile?: boolean;
    fileUrl?: string;
  }>;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "appointment_accepted" | "appointment_rejected" | "video_call_started" | "appointment_request" | "video_call_ended";
  read: boolean;
  createdAt: string;
  appointmentId?: string;
}

export const departments: Department[] = [
  { id: "1", name: "General Medicine", description: "Primary care and general health checkups", icon: "🏥" },
  { id: "2", name: "Cardiology", description: "Heart and cardiovascular system care", icon: "❤️" },
  { id: "3", name: "Dermatology", description: "Skin, hair, and nail treatments", icon: "🧴" },
  { id: "4", name: "Orthopedics", description: "Bone and joint care", icon: "🦴" },
  { id: "5", name: "Neurology", description: "Brain and nervous system care", icon: "🧠" },
  { id: "6", name: "Pediatrics", description: "Medical care for infants, children, and adolescents", icon: "👶" },
  { id: "7", name: "Psychiatry", description: "Mental health and behavioral care", icon: "🧘" },
  { id: "8", name: "Ophthalmology", description: "Eye and vision care", icon: "👁️" },
];

export const doctors: Doctor[] = [];

export function getAllDoctors(): Doctor[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("mediscribe_doctors");
    if (stored) {
      const storedDoctors = JSON.parse(stored);
      const allDoctors = [...doctors];
      storedDoctors.forEach((doc: Doctor) => {
        if (!allDoctors.find(d => d.id === doc.id)) {
          allDoctors.push(doc);
        }
      });
      return allDoctors;
    }
  }
  return doctors;
}

export function addDoctor(doctor: Doctor) {
  const allDoctors = getAllDoctors();
  allDoctors.push(doctor);
  if (typeof window !== "undefined") {
    localStorage.setItem("mediscribe_doctors", JSON.stringify(allDoctors));
  }
}

export function updateDoctor(doctorId: string, updates: Partial<Doctor>) {
  const allDoctors = getAllDoctors();
  const index = allDoctors.findIndex((d) => d.id === doctorId);
  if (index !== -1) {
    allDoctors[index] = { ...allDoctors[index], ...updates };
    if (typeof window !== "undefined") {
      localStorage.setItem("mediscribe_doctors", JSON.stringify(allDoctors));
    }
  }
}

export function deleteDoctor(doctorId: string) {
  let allDoctors = getAllDoctors();
  allDoctors = allDoctors.filter((d) => d.id !== doctorId);
  if (typeof window !== "undefined") {
    localStorage.setItem("mediscribe_doctors", JSON.stringify(allDoctors));
  }
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  createdAt: string;
  transcript: string;
  doctorNotes: string;
  prescription: string;
  patientSummary: string;
  language: string;
  lifestyleRecommendations: string[];
}

let appointments: Appointment[] = [];
let consultations: Consultation[] = [];
let notifications: Notification[] = [];
let currentUser: User | null = null;

export function getNotifications(userId: string): Notification[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("mediscribe_notifications");
    if (stored) {
      notifications = JSON.parse(stored);
    }
  }
  return notifications.filter(n => n.userId === userId);
}

export function addNotification(notification: Notification) {
  notifications.push(notification);
  if (typeof window !== "undefined") {
    localStorage.setItem("mediscribe_notifications", JSON.stringify(notifications));
  }
}

export function markNotificationRead(id: string) {
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications[index].read = true;
    if (typeof window !== "undefined") {
      localStorage.setItem("mediscribe_notifications", JSON.stringify(notifications));
    }
  }
}

export function setCurrentUser(user: User | null) {
  currentUser = user;
  if (typeof window !== "undefined") {
    if (user) {
      sessionStorage.setItem("mediscribe_user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("mediscribe_user");
    }
  }
}

export function getCurrentUser(): User | null {
  if (typeof window !== "undefined" && !currentUser) {
    const stored = sessionStorage.getItem("mediscribe_user");
    if (stored) {
      currentUser = JSON.parse(stored);
    }
  }
  return currentUser;
}

export function getAppointments(): Appointment[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("mediscribe_appointments");
    if (stored) {
      appointments = JSON.parse(stored);
    }
  }
  return appointments;
}

export function addAppointment(appointment: Appointment) {
  appointments.push(appointment);
  if (typeof window !== "undefined") {
    localStorage.setItem("mediscribe_appointments", JSON.stringify(appointments));
  }
}

export function updateAppointment(id: string, updates: Partial<Appointment>) {
  const index = appointments.findIndex((a) => a.id === id);
  if (index !== -1) {
    appointments[index] = { ...appointments[index], ...updates };
    if (typeof window !== "undefined") {
      localStorage.setItem("mediscribe_appointments", JSON.stringify(appointments));
    }
  }
}

export function getConsultations(): Consultation[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("mediscribe_consultations");
    if (stored) {
      consultations = JSON.parse(stored);
    }
  }
  return consultations;
}

export function addConsultation(consultation: Consultation) {
  consultations.push(consultation);
  if (typeof window !== "undefined") {
    localStorage.setItem("mediscribe_consultations", JSON.stringify(consultations));
  }
}

export const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "gu", name: "Gujarati (ગુજરાતી)" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
  { code: "ml", name: "Malayalam (മലയാളം)" },
  { code: "pa", name: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "or", name: "Odia (ଓଡ଼ିଆ)" },
  { code: "as", name: "Assamese (অসমীয়া)" },
  { code: "ur", name: "Urdu (اردو)" },
  { code: "ks", name: "Kashmiri (کٲشُر)" },
  { code: "sd", name: "Sindhi (سنڌي)" },
  { code: "ne", name: "Nepali (नेपाली)" },
  { code: "sa", name: "Sanskrit (संस्कृतम्)" },
  { code: "mai", name: "Maithili (मैथिली)" },
  { code: "kok", name: "Konkani (कोंकणी)" },
  { code: "mni", name: "Manipuri (মৈতৈলোন্)" },
  { code: "doi", name: "Dogri (डोगरी)" },
  { code: "sat", name: "Santali (ᱥᱟᱱᱛᱟᱲᱤ)" },
];

export function getAllUsers(): User[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("mediscribe_all_users");
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
}

export function addUser(user: User) {
  const users = getAllUsers();
  users.push(user);
  if (typeof window !== "undefined") {
    localStorage.setItem("mediscribe_all_users", JSON.stringify(users));
  }
}

export function updateUser(userId: string, updates: Partial<User>) {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    if (typeof window !== "undefined") {
      localStorage.setItem("mediscribe_all_users", JSON.stringify(users));
    }
  }
}

export function deleteUser(userId: string) {
  let users = getAllUsers();
  users = users.filter((u) => u.id !== userId);
  if (typeof window !== "undefined") {
    localStorage.setItem("mediscribe_all_users", JSON.stringify(users));
  }
}

export function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    // If it's not a valid date, return original
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}
