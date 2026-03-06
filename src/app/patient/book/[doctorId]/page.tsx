"use client";

import { useState, useEffect, Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getAllDoctors, departments, addNotification, languages } from "@/lib/store";
import { api } from "@/lib/api";

function BookingForm({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "instant";

  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [department, setDepartment] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [symptoms, setSymptoms] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("09:00");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "patient") {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    const loadDoctor = async () => {
      try {
        const doc = await api.getDoctor(doctorId);
        if (doc) {
          setDoctor(doc);
          const dept = departments.find((d) => d.id === doc.departmentId);
          setDepartment(dept);
        }
      } catch (err) {
        console.error("Failed to load doctor:", err);
      }
    };
    loadDoctor();
  }, [router, doctorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !doctor) return;

    setLoading(true);

    try {
      const appointmentData = {
        _id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patientId: user.id,
        patientName: user.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        department: department?.name || "",
        date: type === "instant" ? new Date().toLocaleDateString() : date,
        time: type === "instant" ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : time,
        language: selectedLanguage,
        status: "pending",
        consultationStarted: false,
        videoCallStarted: false,
      };

      const newAppointment = await api.createAppointment(appointmentData as any);

      if (newAppointment) {
        // Notify doctor (optional: backend could handle this, but keeping frontend trigger for now)
        addNotification({
          id: `ntf_req_${Date.now()}`,
          userId: doctor.id,
          message: `${user.name} has ${type === "instant" ? "requested to Join Video Call" : `booked an appointment for ${date} at ${time}`}.`,
          type: "appointment_request",
          read: false,
          createdAt: new Date().toISOString(),
          appointmentId: newAppointment.id || `apt_${Date.now()}` // Fallback if ID missing
        });

        router.push("/patient/appointments?booked=true");
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !doctor) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900">MediScribe AI</span>
            </Link>
            <Link href="/patient/dashboard" className="text-slate-600 hover:text-blue-600 font-medium">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {type === "instant" ? "Join Video Call" : "Book Appointment"}
          </h1>
          <p className="text-slate-600">
            {type === "instant"
              ? `You are requesting to join a video call with ${doctor.name}`
              : `Schedule a consultation with ${doctor.name}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <img src={doctor.profileImage} alt={doctor.name} className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-blue-50" />
            <h2 className="text-xl font-bold text-slate-900">{doctor.name}</h2>
            <p className="text-blue-600 font-medium">{doctor.specialization}</p>
            <p className="text-slate-500 text-sm mt-1">{department?.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {type === "appointment" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Symptoms (Optional)</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 resize-none transition-all"
                placeholder="Briefly describe your symptoms..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : type === "instant" ? "Join Video Call Now" : "Confirm Appointment"}
            </button>

            <p className="text-center text-xs text-slate-400">
              {type === "instant"
                ? "The doctor will be notified and will start the session shortly."
                : "Your appointment request will be sent to the doctor for confirmation."}
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function BookingPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const resolvedParams = use(params);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <BookingForm doctorId={resolvedParams.doctorId} />
    </Suspense>
  );
}
