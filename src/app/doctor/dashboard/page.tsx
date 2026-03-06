"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, setCurrentUser, addNotification, formatDate, type Appointment } from "@/lib/store";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function DoctorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [doctorId, setDoctorId] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "scheduled" | "completed">("all");

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "doctor") {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    // Simplified: currentUser from login IS the doctor profile now
    const idToUse = currentUser.id;
    setDoctorId(idToUse);

    loadAppointments(idToUse);

    const interval = setInterval(() => loadAppointments(idToUse), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const loadAppointments = async (id: string) => {
    try {
      const allAppointments = await api.getAppointments({ doctorId: id });
      setAppointments(allAppointments);
    } catch (err) {
      console.error("Failed to load appointments", err);
    }
  };

  const handleAccept = async (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    await api.updateAppointment(appointmentId, { status: "accepted" });
    addNotification({
      id: `ntf_${Date.now()}`,
      userId: apt.patientId,
      message: `Appointment Accepted: Dr. ${user?.name} has accepted your appointment for ${formatDate(apt.date)} ${apt.time}.`,
      type: "appointment_accepted",
      read: false,
      createdAt: new Date().toISOString(),
      appointmentId: apt.id
    });
    loadAppointments(doctorId);
  };

  const handleSendReminders = () => {
    const upcoming = appointments.filter(a => a.status === "accepted" || a.status === "scheduled");
    if (upcoming.length === 0) return;

    upcoming.forEach(apt => {
      handleSendSingleReminder(apt.id);
    });

    toast.success(`Reminders sent to ${upcoming.length} patients.`);
  };

  const handleSendSingleReminder = (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    addNotification({
      id: `ntf_rem_${apt.id}_${Date.now()}`,
      userId: apt.patientId,
      message: `Reminder: You have an upcoming appointment with Dr. ${user?.name} on ${formatDate(apt.date)} at ${apt.time}.`,
      type: "appointment_request",
      read: false,
      createdAt: new Date().toISOString(),
      appointmentId: apt.id
    });
  };

  const handleReject = async (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    await api.updateAppointment(appointmentId, { status: "cancelled" });
    addNotification({
      id: `ntf_rej_${Date.now()}`,
      userId: apt.patientId,
      message: `Appointment Not Accepted: Dr. ${user?.name} is unavailable for the requested time (${formatDate(apt.date)} ${apt.time}).`,
      type: "appointment_rejected",
      read: false,
      createdAt: new Date().toISOString(),
      appointmentId: apt.id
    });
    loadAppointments(doctorId);
  };

  const handleStartVideoCall = async (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    await api.updateAppointment(appointmentId, {
      videoCallStarted: true,
      videoCallStartedAt: new Date().toISOString()
    });

    addNotification({
      id: `ntf_vc_${Date.now()}`,
      userId: apt.patientId,
      message: `Dr. ${user?.name} has started the video call. Please join now.`,
      type: "video_call_started",
      read: false,
      createdAt: new Date().toISOString(),
      appointmentId: apt.id
    });

    router.push(`/consultation/${appointmentId}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/");
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === "all") return true;
    return apt.status === filter;
  });

  if (!user) return null;

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
              <Link href="/doctor/patients" className="text-slate-600 hover:text-blue-600 font-medium">
                My Patients
              </Link>
              <Link href="/doctor/consultations" className="text-slate-600 hover:text-blue-600 font-medium">
                Consultations
              </Link>
              <Link href="/doctor/profile/edit" className="text-slate-600 hover:text-blue-600 font-medium">
                Edit Profile
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.name}</h1>
          <p className="text-slate-600 mt-1">Manage your appointments and consultations</p>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total", value: appointments.length, color: "bg-blue-500" },
            { label: "Pending", value: appointments.filter((a) => a.status === "pending").length, color: "bg-yellow-500" },
            { label: "Accepted", value: appointments.filter((a) => a.status === "accepted").length, color: "bg-indigo-500" },
            { label: "Scheduled", value: appointments.filter((a) => a.status === "scheduled").length, color: "bg-green-500" },
            { label: "Completed", value: appointments.filter((a) => a.status === "completed").length, color: "bg-slate-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white font-bold mb-3`}>
                {stat.value}
              </div>
              <p className="text-slate-600 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Patient Appointments</h2>
            <div className="flex gap-4">
              <button
                onClick={handleSendReminders}
                className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200 flex items-center gap-2 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Send Reminders to All
              </button>
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex gap-2">
                {(["all", "pending", "accepted", "scheduled", "completed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No appointments found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAppointments.map((apt) => (
                <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-medium">
                      {apt.patientName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{apt.patientName}</h3>
                      <p className="text-sm text-slate-600">
                        {apt.date} {apt.time && `at ${apt.time}`} • {apt.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      apt.status === "accepted" ? "bg-indigo-100 text-indigo-700" :
                        apt.status === "scheduled" ? "bg-green-100 text-green-700" :
                          apt.status === "completed" ? "bg-slate-100 text-slate-700" :
                            "bg-red-100 text-red-700"
                      }`}>
                      {apt.status}
                    </span>
                    {apt.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(apt.id)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(apt.id)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {(apt.status === "accepted" || apt.status === "scheduled") && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleSendSingleReminder(apt.id);
                            alert(`Reminder sent to ${apt.patientName}`);
                          }}
                          className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center gap-1"
                          title="Send Reminder"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          Remind
                        </button>
                        <button
                          onClick={() => handleStartVideoCall(apt.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                        >
                          Join Video Call
                        </button>
                      </div>
                    )}

                    {apt.status === "completed" && (
                      <Link
                        href={`/consultation/${apt.id}/summary`}
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
                      >
                        View Summary
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-12 bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Treated Patients & History</h2>
          </div>
          <div className="p-4">
            {appointments.filter(a => a.status === "completed").length === 0 ? (
              <p className="text-center py-8 text-slate-500 italic">No history available yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-sm border-b border-slate-100">
                      <th className="pb-3 font-medium">Patient Name</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appointments.filter(a => a.status === "completed").map((apt) => (
                      <tr key={apt.id} className="text-sm">
                        <td className="py-3 font-medium text-slate-900">{apt.patientName}</td>
                        <td className="py-3 text-slate-600">{formatDate(apt.date)}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                            Completed
                          </span>
                        </td>
                        <td className="py-3">
                          <Link href={`/consultation/${apt.id}/summary`} className="text-blue-600 hover:underline">
                            View History
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}