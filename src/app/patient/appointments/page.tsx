"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, setCurrentUser, formatDate, type Appointment } from "@/lib/store";
import { api } from "@/lib/api";

function AppointmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== "patient") {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      try {
        const apts = await api.getAppointments({ patientId: currentUser.id });
        setAppointments(apts);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      }

      if (searchParams.get("booked") === "true") {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      }
    };
    initData();
  }, [router, searchParams]);

  useEffect(() => {
    const checkReminders = () => {
      appointments.forEach((apt) => {
        if (apt.status === "scheduled" && apt.time) {
          const now = new Date();
          const [hours, minutes] = apt.time.split(":").map(Number);
          const aptDate = new Date(apt.date);
          aptDate.setHours(hours, minutes, 0, 0);

          const timeDiff = aptDate.getTime() - now.getTime();
          const minutesUntilApt = Math.floor(timeDiff / 60000);

          if (minutesUntilApt <= 5 && minutesUntilApt >= 0 && !reminders[apt.id]) {
            setReminders(prev => ({ ...prev, [apt.id]: true }));
            if (typeof window !== "undefined" && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification("Appointment Reminder", {
                  body: `Your appointment with ${apt.doctorName} is starting soon! Click to join the video call.`,
                  icon: "/icon.png",
                  requireInteraction: true,
                });
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
              }
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000);
    checkReminders();

    return () => clearInterval(interval);
  }, [appointments, reminders]);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/");
  };

  if (!user) return null;

  const upcomingAppointments = appointments.filter((a) => a.status !== "completed" && a.status !== "cancelled");
  const pastAppointments = appointments.filter((a) => a.status === "completed");

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
              <Link href="/patient/dashboard" className="text-slate-600 hover:text-blue-600 font-medium">
                Dashboard
              </Link>
              <Link href="/patient/profile" className="text-slate-600 hover:text-blue-600 font-medium">
                Profile
              </Link>
              <button onClick={handleLogout} className="text-slate-600 hover:text-red-600 text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800">Join Video Call request sent successfully! The doctor will be notified and will start the session shortly.</span>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Video Calls</h1>
          <p className="text-slate-600 mt-1">View and manage your video calls</p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Upcoming Video Calls</h2>
          {upcomingAppointments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-500 mb-4">No upcoming video calls</p>
              <Link href="/patient/dashboard" className="text-blue-600 hover:underline">
                Join a video call
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {apt.doctorName.split(" ").map((n) => n.charAt(0)).join("").slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{apt.doctorName}</h3>
                        <p className="text-sm text-slate-600">{apt.department}</p>
                        <p className="text-sm text-slate-500">
                          {formatDate(apt.date)} {apt.time && `at ${apt.time}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        apt.status === "accepted" ? "bg-indigo-100 text-indigo-700" :
                          apt.status === "scheduled" ? "bg-green-100 text-green-700" :
                            "bg-slate-100 text-slate-700"
                        }`}>
                        {apt.status === "pending" ? "Awaiting Acceptance" : apt.status}
                      </span>
                      {apt.videoCallStarted && (
                        <Link
                          href={`/consultation/${apt.id}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 animate-pulse"
                        >
                          Join Video Call
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Past Video Calls</h2>
          {pastAppointments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-slate-500">No past video calls</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((apt) => (
                <div key={apt.id} className="bg-white rounded-xl border border-slate-200 p-6 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold">
                        {apt.doctorName.split(" ").map((n) => n.charAt(0)).join("").slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{apt.doctorName}</h3>
                        <p className="text-sm text-slate-600">{apt.department}</p>
                        <p className="text-sm text-slate-500">{formatDate(apt.date)} at {apt.time}</p>
                      </div>
                    </div>
                    <Link
                      href={`/consultation/${apt.id}/summary?view=history`}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
                    >
                      View Summary
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function PatientAppointmentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AppointmentsContent />
    </Suspense>
  );
}