"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, setCurrentUser, formatDate } from "@/lib/store";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function PatientReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "patient") {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    fetchReports(currentUser.id);
  }, [router]);

  const fetchReports = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch all consultations for this patient
      const cons = await api.getConsultations({ patientId: userId });
      // Only show ones sent to patient
      const sentReports = cons.filter((c: any) => c.isSentToPatient);
      
      // We need more info for each report (doctor name, etc.)
      const allApts = await api.getAppointments({ patientId: userId });
      
      const reportsWithDetails = sentReports.map((c: any) => {
          const apt = allApts.find((a: any) => a.id === c.appointmentId || a._id === c.appointmentId);
          return {
              ...c,
              doctorName: apt?.doctorName || "Unknown Doctor",
              department: apt?.department || "General",
              date: apt?.date || c.createdAt
          };
      });

      setConsultations(reportsWithDetails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error("Failed to fetch reports", err);
      toast.error("Failed to load your medical reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/patient/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900">MediScribe AI</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/patient/dashboard" className="text-slate-600 hover:text-blue-600 font-medium">Dashboard</Link>
              <Link href="/patient/appointments" className="text-slate-600 hover:text-blue-600 font-medium">My Appointments</Link>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {user.name.charAt(0)}
                </div>
                <button onClick={handleLogout} className="text-slate-600 hover:text-red-600 text-sm font-medium">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">My Medical Reports</h1>
          <p className="text-slate-500 mt-2 text-lg">History of all consultations and doctor recommendations.</p>
        </header>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Loading your reports...</p>
            </div>
        ) : consultations.length === 0 ? (
          <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">📄</div>
            <h3 className="text-xl font-bold text-slate-900">No reports yet</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">Once your doctor finalizes a consultation, your reports will appear here for you to download or view.</p>
            <Link href="/patient/book" className="mt-8 inline-block px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">Book an Appointment</Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {consultations.map((report) => (
              <div key={report.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl group-hover:scale-110 transition-transform">
                      {report.department === 'Cardiology' ? '❤️' : 
                       report.department === 'Neurology' ? '🧠' : 
                       report.department === 'Pediatrics' ? '👶' : '👨‍⚕️'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Consultation with Dr. {report.doctorName}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {report.department}</span>
                        <span className="flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {formatDate(report.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Link 
                        href={`/consultation/${report.appointmentId}/summary`}
                        className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all text-center shadow-lg shadow-slate-200"
                    >
                        View Full Report
                    </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400 text-sm">
          © 2026 MediScribe AI • Patient Medical Records System
      </footer>
    </div>
  );
}
