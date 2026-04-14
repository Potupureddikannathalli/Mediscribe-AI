"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, setCurrentUser, Consultation } from "@/lib/store";
import { api } from "@/lib/api";

export default function DoctorConsultationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  useEffect(() => {
    const initData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== "doctor") {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      try {
        const data = await api.getConsultations({ doctorId: currentUser.id });
        setConsultations(data);

        // Fetch missing appointments for the consultations
        const apts = await api.getAppointments({ doctorId: currentUser.id });
        setAppointments(apts);
      } catch (err) {
        console.error("Failed to fetch consultations", err);
      }
    };
    initData();
  }, [router]);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/");
  };

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
              <Link href="/doctor/dashboard" className="text-slate-600 hover:text-blue-600 font-medium">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-slate-600 hover:text-red-600 text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Past Consultations</h1>
          <p className="text-slate-600 mt-1">View all completed consultations and their summaries</p>
        </div>

        {consultations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No consultations yet</h3>
            <p className="text-slate-500 mb-4">Your completed consultations will appear here</p>
            <Link href="/doctor/dashboard" className="text-blue-600 hover:underline">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => {
              const appointment = appointments.find((a) => a.id === consultation.appointmentId || a._id === consultation.appointmentId);
              return (
                <div key={consultation.id} className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                        {appointment?.patientName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{appointment?.patientName}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${consultation.isSentToPatient ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {consultation.isSentToPatient ? 'Sent' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{appointment?.department}</p>
                        <p className="text-sm text-slate-500">{new Date(consultation.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Link
                      href={`/consultation/${consultation.appointmentId}/summary`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      View Full Summary
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Doctor&apos;s Notes</p>
                      <p className="text-sm text-slate-700 line-clamp-3">{consultation.doctorNotes.substring(0, 150)}...</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">Prescription</p>
                      <p className="text-sm text-slate-700 line-clamp-3">{consultation.prescription.substring(0, 150)}...</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs text-emerald-600 mb-1">Patient Summary</p>
                      <p className="text-sm text-slate-700 line-clamp-3">{consultation.patientSummary.substring(0, 150)}...</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
