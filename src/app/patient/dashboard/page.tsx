"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, setCurrentUser, departments, getAppointments, getNotifications, markNotificationRead, formatDate, type Appointment, type Notification } from "@/lib/store";
import { api } from "@/lib/api";

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "patient") {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    refreshData(currentUser.id);

    const interval = setInterval(() => refreshData(currentUser.id), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const refreshData = async (userId: string) => {
    try {
      const apts = await api.getAppointments({ patientId: userId });
      setAppointments(apts);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    }
    // Notifications still local for now as per plan, or can be moved to API later.
    // Keeping local for notifications to minimize scope explosion, focusing on core data first.
    setNotifications(getNotifications(userId));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/");
  };

  const handleNotificationClick = (notification: Notification) => {
    markNotificationRead(notification.id);
    if (notification.appointmentId) {
      const apt = appointments.find(a => a.id === notification.appointmentId);
      if (apt?.videoCallStarted && notification.type !== "video_call_ended" && notification.type !== "consultation_ready") {
        router.push(`/consultation/${apt.id}`);
      } else if (notification.type === "consultation_ready") {
        router.push(`/consultation/${notification.appointmentId}/summary`);
      } else {
        router.push("/patient/appointments");
      }
    }
    refreshData(user!.id);
  };

  if (!user) return null;

  const unreadNotifications = notifications.filter(n => !n.read);

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
            <div className="flex items-center gap-4">
              <Link href="/patient/profile" className="text-slate-600 hover:text-blue-600 font-medium">
                My Profile
              </Link>
              <Link href="/patient/appointments" className="text-slate-600 hover:text-blue-600 font-medium">
                My Appointments
              </Link>
              <Link href="/patient/reports" className="text-slate-600 hover:text-blue-600 font-medium">
                Medical Reports
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-medium">
                  {user.name.charAt(0)}
                </div>
                <button onClick={handleLogout} className="text-slate-600 hover:text-red-600 text-sm font-medium">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.name}</h1>
            <p className="text-slate-600 mt-1">Book appointments and manage your health</p>
          </div>

          {unreadNotifications.length > 0 && (
            <div className="w-full md:w-80 space-y-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Recent Messages</h3>
              {unreadNotifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${notification.type === "video_call_started"
                    ? "bg-green-50 border-green-200 animate-pulse"
                    : notification.type === "video_call_ended"
                      ? "bg-red-50 border-red-200"
                      : "bg-indigo-50 border-indigo-200"
                    }`}
                >
                  <p className={`text-sm font-medium ${notification.type === "video_call_started"
                    ? "text-green-900"
                    : notification.type === "video_call_ended"
                      ? "text-red-900"
                      : "text-indigo-900"
                    }`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </p>
                  {notification.type === "video_call_started" && (
                    <button className="mt-2 w-full py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold">
                      JOIN VIDEO CALL NOW
                    </button>
                  )}
                  {notification.type === "video_call_ended" && (
                    <button className="mt-2 w-full py-1.5 bg-slate-600 text-white rounded-lg text-xs font-bold">
                      AWAITING REPORTS
                    </button>
                  )}
                  {notification.type === "consultation_ready" && (
                    <button className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-200">
                      VIEW REPORTS
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {appointments.some(a => a.status !== "completed") && (
          <div className="mb-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 text-lg">Your Video Calls</h3>
            <div className="grid gap-4">
              {appointments.filter((a) => a.status !== "completed").map((apt) => (
                <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
                      👨‍⚕️
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{apt.doctorName}</p>
                      <p className="text-sm text-slate-600">{formatDate(apt.date)} • {apt.department}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${apt.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        apt.status === "accepted" ? "bg-indigo-100 text-indigo-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {apt.videoCallStarted ? (
                      <Link
                        href={`/consultation/${apt.id}`}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all text-center animate-bounce"
                      >
                        Join Video Call
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-200 text-slate-500 rounded-xl text-sm font-medium cursor-not-allowed"
                      >
                        {apt.status === "pending" ? "Awaiting Acceptance" : "Waiting for Doctor"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Medical Departments</h2>
            <Link href="/patient/appointments" className="text-blue-600 text-sm font-semibold hover:underline">
              View All Appointments
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {departments.map((dept) => (
              <Link
                key={dept.id}
                href={`/patient/department/${dept.id}`}
                className="p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-400 hover:shadow-xl transition-all group text-left"
              >
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{dept.icon}</div>
                <h3 className="font-bold text-slate-900">{dept.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{dept.description}</p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-bold">
                  Book Now
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}