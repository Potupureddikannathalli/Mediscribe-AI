"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, setCurrentUser, departments, type Doctor } from "@/lib/store";
import { api } from "@/lib/api";

export default function DepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params.id as string;

  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [registeredDoctors, setRegisteredDoctors] = useState<Doctor[]>([]);

  const department = departments.find((d) => d.id === departmentId);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "patient") {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    const loadDoctors = async () => {
      try {
        const allDoctors = await api.getDoctors();
        setRegisteredDoctors(allDoctors.filter((d: any) => d.departmentId === departmentId));
      } catch (err) {
        console.error("Failed to load doctors:", err);
      }
    };
    loadDoctors();
  }, [router, departmentId]);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/");
  };

  if (!user || !department) return null;

  return (
    <div className="min-h-screen bg-slate-50">
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
              <Link href="/patient/profile" className="text-slate-600 hover:text-blue-600 font-medium">
                My Profile
              </Link>
              <Link href="/patient/appointments" className="text-slate-600 hover:text-blue-600 font-medium">
                My Appointments
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
        <div className="mb-8">
          <Link href="/patient/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-5xl">{department.icon}</div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{department.name}</h1>
              <p className="text-slate-600 mt-1">{department.description}</p>
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Available Doctors ({registeredDoctors.length})
          </h2>

          {registeredDoctors.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg text-slate-500">No doctors available in this department yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredDoctors.map((doctor) => (
                <div key={doctor.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <img
                      src={doctor.profileImage}
                      alt={doctor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{doctor.name}</h3>
                      <p className="text-blue-600 text-sm">{doctor.specialization}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm text-slate-600">{doctor.rating}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-sm text-slate-600">{doctor.experience} yrs exp</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-600 mb-3">Available slots today:</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {doctor.availableSlots.slice(0, 4).map((slot) => (
                        <span key={slot} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                          {slot}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/patient/book/${doctor.id}?type=appointment`}
                        className="flex-1 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg text-sm font-bold text-center hover:bg-blue-50 transition-all"
                      >
                        Book Appointment
                      </Link>
                      <Link
                        href={`/patient/book/${doctor.id}?type=instant`}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-bold text-center hover:shadow-lg transition-all"
                      >
                        Join Video Call
                      </Link>
                    </div>
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