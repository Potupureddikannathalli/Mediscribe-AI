"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MediScribe AI
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <button className="px-4 py-2 text-slate-700 hover:text-blue-600 font-medium transition-colors">
                  Login
                </button>
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link href="/login/patient" className="block px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-t-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>Patient Login</span>
                    </div>
                  </Link>
                  <Link href="/login/doctor" className="block px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span>👨‍⚕️</span>
                      <span>Doctor Login</span>
                    </div>
                  </Link>
                  <Link href="/login/admin" className="block px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-b-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <span>🛡️</span>
                      <span>Admin Login</span>
                    </div>
                  </Link>
                </div>
              </div>
              <Link href="/register" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
              Healthcare Made
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Simple & Smart
              </span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              AI-powered medical consultations with real-time transcription, automated prescriptions, and personalized health recommendations.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">
                Register Now
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-slate-900 mb-12"
          >
            Choose Your Role
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { role: "patient", title: "Patient", desc: "Book appointments, consult with doctors, and manage your health records", icon: "👤", color: "from-emerald-500 to-teal-500" },
              { role: "doctor", title: "Doctor", desc: "Manage appointments, conduct video consultations, and use AI assistance", icon: "👨‍⚕️", color: "from-blue-500 to-indigo-500" },
              { role: "admin", title: "Admin", desc: "Manage users, departments, and oversee the entire platform", icon: "🛡️", color: "from-purple-500 to-pink-500" },
            ].map((item, index) => (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredCard(item.role)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <Link href={`/register?role=${item.role}`}>
                  <div className={`relative p-8 bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer ${hoveredCard === item.role ? "border-transparent shadow-2xl scale-105" : "border-slate-200 shadow-lg"}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 rounded-2xl transition-opacity duration-300 ${hoveredCard === item.role ? "opacity-5" : ""}`} />
                    <div className="text-5xl mb-4">{item.icon}</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-600">{item.desc}</p>
                    <div className={`mt-6 inline-flex items-center gap-2 font-medium bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                      Register as {item.title}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Our Departments</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "General Medicine", icon: "🏥" },
              { name: "Cardiology", icon: "❤️" },
              { name: "Dermatology", icon: "🧴" },
              { name: "Orthopedics", icon: "🦴" },
              { name: "Neurology", icon: "🧠" },
              { name: "Pediatrics", icon: "👶" },
              { name: "Psychiatry", icon: "🧘" },
              { name: "Ophthalmology", icon: "👁️" },
            ].map((dept, i) => (
              <motion.div
                key={dept.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-3">{dept.icon}</div>
                <p className="font-medium text-slate-900">{dept.name}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold">MediScribe AI</span>
            </div>
            <p className="text-slate-400 text-sm">© 2025 MediScribe AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;