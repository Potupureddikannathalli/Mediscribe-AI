"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, Consultation } from "@/lib/store";
import { api } from "@/lib/api";

export default function DoctorPatientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [allConsultations, setAllConsultations] = useState<Consultation[]>([]);

  useEffect(() => {
    const initData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== "doctor") {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      try {
        const allAppointments = await api.getAppointments({ doctorId: currentUser.id });
        const doctorAppointments = allAppointments;

        // Get unique patients
        const uniquePatientsMap = new Map();
        doctorAppointments.forEach((apt: any) => {
          if (!uniquePatientsMap.has(apt.patientId)) {
            uniquePatientsMap.set(apt.patientId, {
              id: apt.patientId,
              name: apt.patientName,
              department: apt.department
            });
          }
        });
        setPatients(Array.from(uniquePatientsMap.values()));

        const allConsultations = await api.getConsultations({ doctorId: currentUser.id });
        setAllConsultations(allConsultations);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    initData();
  }, [router]);


  const getPatientHistory = (patientId: string) => {
    return allConsultations.filter(c => {
      const cPatientId = typeof c.patientId === 'object' ? (c.patientId as any)?._id : c.patientId;
      const cDoctorId = typeof c.doctorId === 'object' ? (c.doctorId as any)?._id : c.doctorId;
      return cPatientId === patientId && cDoctorId === user?.id;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/doctor/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="font-bold text-slate-900">Back to Dashboard</span>
            </Link>
            <div className="font-bold text-slate-900 text-lg">My Patients</div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Patient List */}
          <div className="md:col-span-1 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">👥</span>
              Patients Treated
            </h2>
            {patients.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 italic">
                No patients found.
              </div>
            ) : (
              patients.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedPatientId === p.id
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-white border-slate-200 text-slate-900 hover:border-blue-400"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedPatientId === p.id ? "bg-white/20" : "bg-blue-100 text-blue-600"}`}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{p.name}</p>
                      <p className={`text-xs ${selectedPatientId === p.id ? "text-blue-100" : "text-slate-500"}`}>{p.department}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Patient History */}
          <div className="md:col-span-2">
            {!selectedPatientId ? (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 border-dashed text-slate-400">
                <div className="text-6xl mb-4 opacity-50">📄</div>
                <p className="font-medium">Select a patient to view their consultation history</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Consultation History: {patients.find(p => p.id === selectedPatientId)?.name}
                  </h2>
                </div>

                {getPatientHistory(selectedPatientId).length === 0 ? (
                  <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-500">
                    No completed consultations found for this patient.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getPatientHistory(selectedPatientId).map((cons) => (
                      <div key={cons.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">Completed</span>
                              <span className="text-slate-500 text-sm font-medium">{new Date(cons.createdAt).toLocaleDateString()}</span>
                            </div>
                            <Link
                              href={`/consultation/${cons.appointmentId}/summary`}
                              className="text-blue-600 font-bold text-sm hover:underline"
                            >
                              View Full Summary →
                            </Link>
                          </div>

                          <div className="grid grid-cols-2 gap-6 mt-4">
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Doctor Notes</h4>
                              <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100">{cons.doctorNotes}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescription</h4>
                              <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100">{cons.prescription}</p>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Consultation ID: {cons.id}</span>
                          <span className="text-xs font-bold text-slate-900">Language: {cons.language === 'en' ? 'English' : cons.language}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
