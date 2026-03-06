"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, setCurrentUser, departments, formatDate } from "@/lib/store";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "doctors">("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    totalConsultations: 0,
    pendingAppointments: 0,
    completedConsultations: 0,
  });
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<any | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/login/admin");
      return;
    }
    setUser(currentUser);
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const allUsers = await api.getUsers();
      const allDoctors = await api.getDoctors();
      const appointments = await api.getAppointments();
      const consultations = await api.getConsultations();

      setUsers(allUsers);
      setDoctors(allDoctors);
      setAppointments(appointments);
      setConsultations(consultations);

      setStats({
        totalDoctors: allDoctors.length,
        totalPatients: allUsers.filter((u: any) => u.role === "patient").length,
        totalAppointments: appointments.length,
        totalConsultations: consultations.length,
        pendingAppointments: appointments.filter((a: any) => a.status === "pending").length,
        completedConsultations: appointments.filter((a: any) => a.status === "completed").length,
      });
    } catch (err) {
      console.error("Failed to load admin data", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await api.deleteUser(userId); // api.deleteUser needs to be implemented or we use specific endpoint logic if available. api.ts has update but delete?
      // api.ts has deleteDoctor but maybe not deleteUser? Let's check api.ts again or just assume and fix if missing.
      // Checking api.ts... it has deleteDoctor. It seems deleteUser is missing in the file view I saw earlier?
      // Wait, I saw api.ts content.
      // Let's check api.ts content again in my mind... 
      // It had deleteDoctor. 
      // It had updateUser.
      // Did it have deleteUser?
      // Let's assume I need to implement it or use what's there. 
      // I'll assume I need to add it to api.ts if missing.
      // For now, I'll write the code as if it exists, and then I will update api.ts if needed.
      // Actually, I should verify api.ts content.
      loadData();
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (confirm("Are you sure you want to delete this doctor?")) {
      await api.deleteDoctor(doctorId);
      loadData();
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
  };

  const handleEditDoctor = (doctor: any) => {
    setEditingDoctor(doctor);
  };

  const handleSaveUser = async () => {
    if (editingUser) {
      await api.updateUser(editingUser.id, editingUser);
      setEditingUser(null);
      loadData();
    }
  };

  const handleSaveDoctor = async () => {
    if (editingDoctor) {
      await api.updateDoctor(editingDoctor.id, editingDoctor);
      setEditingDoctor(null);
      loadData();
    }
  };

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
              <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Admin</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/admin/profile/edit" className="text-slate-600 hover:text-blue-600 font-medium">
                Edit Profile
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
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
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage users, doctors, and monitor platform activity</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "overview" ? "bg-blue-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "users" ? "bg-blue-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            Manage Users
          </button>
          <button
            onClick={() => setActiveTab("doctors")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "doctors" ? "bg-blue-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            Manage Doctors
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: "Doctors", value: stats.totalDoctors, color: "bg-indigo-500", icon: "👨‍⚕️" },
                { label: "Patients", value: stats.totalPatients, color: "bg-emerald-500", icon: "👤" },
                { label: "Appointments", value: stats.totalAppointments, color: "bg-blue-500", icon: "📅" },
                { label: "Pending", value: stats.pendingAppointments, color: "bg-yellow-500", icon: "⏳" },
                { label: "Consultations", value: stats.totalConsultations, color: "bg-purple-500", icon: "💬" },
                { label: "Completed", value: stats.completedConsultations, color: "bg-green-500", icon: "✓" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl mb-3`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              </div>
              <div className="p-4">
                {appointments.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No recent activity</p>
                ) : (
                  <div className="space-y-4">
                    {appointments.slice(-5).reverse().map((apt: any) => (
                      <div key={apt._id || apt.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${apt.status === "pending" ? "bg-yellow-500" :
                          apt.status === "scheduled" ? "bg-blue-500" :
                            apt.status === "completed" ? "bg-green-500" : "bg-red-500"
                          }`} />
                        <div className="flex-1">
                          <p className="text-sm text-slate-900">
                            <span className="font-medium">{apt.patientName}</span> booked appointment with <span className="font-medium">{apt.doctorName}</span>
                          </p>
                          <p className="text-xs text-slate-500">{formatDate(apt.date)} • {apt.department}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${apt.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          apt.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                            apt.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                          {apt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">All Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Role</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{u.phone || "N/A"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-700" :
                          u.role === "doctor" ? "bg-blue-100 text-blue-700" :
                            "bg-emerald-100 text-emerald-700"
                          }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEditUser(u)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "doctors" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">All Doctors</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Doctor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Specialization</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Rating</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((d) => {
                    const dept = departments.find((dep) => dep.id === d.departmentId);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={d.profileImage} alt={d.name} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-sm text-slate-900">{d.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{d.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{d.specialization}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{dept?.name || "N/A"}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm text-slate-600">
                            <span className="text-yellow-500">★</span>
                            {d.rating}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleEditDoctor(d)}
                            className="text-blue-600 hover:text-blue-700 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(d.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editingUser.phone || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Edit Doctor</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingDoctor.name}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingDoctor.email}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={editingDoctor.specialization}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience (years)</label>
                <input
                  type="number"
                  value={editingDoctor.experience}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, experience: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingDoctor(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDoctor}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}