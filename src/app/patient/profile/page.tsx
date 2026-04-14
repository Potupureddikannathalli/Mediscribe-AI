"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, setCurrentUser, getAppointments, doctors, type Consultation } from "@/lib/store";
import { api } from "@/lib/api";

export default function PatientProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "recommendations">("overview");
  const [profile, setProfile] = useState({
    age: "",
    gender: "",
    bloodGroup: "",
    height: "",
    weight: "",
    allergies: [] as string[],
    conditions: [] as string[],
    emergencyContact: "",
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "patient") {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    const savedProfile = localStorage.getItem(`patient_profile_${currentUser.id}`);
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }

    // Fetch consultations from backend
    const fetchConsultations = async () => {
      try {
        const data = await api.getConsultations({ patientId: currentUser.id });
        setConsultations(data);
      } catch (err) {
        console.error("Failed to fetch consultations", err);
      }
    };
    fetchConsultations();
  }, [router]);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/");
  };

  const allRecommendations = consultations.flatMap((c) => c.lifestyleRecommendations);
  const uniqueRecommendations = [...new Set(allRecommendations)];

  const getDoctorVisitCount = () => {
    const doctorVisits = new Map<string, { count: number; doctorName: string; lastVisit: string }>();
    consultations.forEach(c => {
      const doctor = doctors.find(d => d.id === c.doctorId);
      const doctorName = doctor?.name || "Unknown Doctor";
      const existing = doctorVisits.get(c.doctorId);
      if (existing) {
        doctorVisits.set(c.doctorId, {
          count: existing.count + 1,
          doctorName,
          lastVisit: c.createdAt > existing.lastVisit ? c.createdAt : existing.lastVisit,
        });
      } else {
        doctorVisits.set(c.doctorId, { count: 1, doctorName, lastVisit: c.createdAt });
      }
    });
    return doctorVisits;
  };

  const doctorVisitStats = getDoctorVisitCount();

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
              <Link href="/patient/dashboard" className="text-slate-600 hover:text-blue-600 font-medium">
                Dashboard
              </Link>
              <Link href="/patient/appointments" className="text-slate-600 hover:text-blue-600 font-medium">
                Appointments
              </Link>
              <button onClick={handleLogout} className="text-slate-600 hover:text-red-600 text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-blue-100 mt-1">{user.email}</p>
                <p className="text-blue-100">{user.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <Link
                href="/patient/profile/edit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
              <div>
                <p className="text-blue-100 text-sm">Patient ID</p>
                <p className="font-mono font-bold text-sm">{user.id.slice(0, 8)}</p>
                <p className="text-blue-100 text-sm mt-2">Total Consultations</p>
                <p className="text-2xl font-bold">{consultations.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(["overview", "history", "recommendations"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
                {profile.age || profile.gender || profile.bloodGroup ? (
                  <div className="space-y-4">
                    {[
                      { label: "Age", value: profile.age || "Not set" },
                      { label: "Gender", value: profile.gender || "Not set" },
                      { label: "Blood Group", value: profile.bloodGroup || "Not set" },
                      { label: "Height", value: profile.height || "Not set" },
                      { label: "Weight", value: profile.weight || "Not set" },
                      { label: "Emergency Contact", value: profile.emergencyContact || "Not set" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-medium text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No profile information yet</p>
                    <Link href="/patient/profile/edit" className="text-blue-600 hover:underline mt-2 inline-block">
                      Complete your profile
                    </Link>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Allergies</h2>
                  {profile.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.allergies.map((allergy) => (
                        <span key={allergy} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No allergies recorded</p>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Medical Conditions</h2>
                  {profile.conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.conditions.map((condition) => (
                        <span key={condition} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                          {condition}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No conditions recorded</p>
                  )}
                </div>
              </div>
            </div>

            {doctorVisitStats.size > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Doctor Visit Statistics</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {Array.from(doctorVisitStats.entries()).map(([doctorId, stats]) => (
                    <div key={doctorId} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-slate-900">{stats.doctorName}</h3>
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                          {stats.count} {stats.count === 1 ? "visit" : "visits"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Last visit: {new Date(stats.lastVisit).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Consultation History</h2>
              <p className="text-sm text-slate-600 mt-1">Track your visits and consultation records ({consultations.length} total)</p>
            </div>
            {consultations.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No consultation history yet</p>
                <Link href="/patient/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
                  Book your first appointment
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {consultations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((consultation) => {
                  const appointment = getAppointments().find((a) => a.id === consultation.appointmentId);
                  const doctor = doctors.find(d => d.id === consultation.doctorId);
                  return (
                    <div key={consultation.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {doctor && (
                            <img src={doctor.profileImage} alt={doctor.name} className="w-12 h-12 rounded-full object-cover" />
                          )}
                          <div>
                            <h3 className="font-medium text-slate-900">{appointment?.doctorName}</h3>
                            <p className="text-sm text-slate-600">{appointment?.department}</p>
                            <p className="text-sm text-slate-500">{new Date(consultation.createdAt).toLocaleDateString()} at {appointment?.time}</p>
                          </div>
                        </div>
                        <Link
                          href={`/consultation/${consultation.appointmentId}/summary?view=history`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "recommendations" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Personalized Lifestyle Recommendations</h2>
            {uniqueRecommendations.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Complete a consultation to receive personalized recommendations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {uniqueRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-800">{rec}</p>
                    </div>
                    <button className="text-emerald-600 hover:text-emerald-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}