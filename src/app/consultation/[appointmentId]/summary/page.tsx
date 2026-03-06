"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getAppointments, languages } from "@/lib/store";
import { api } from "@/lib/api";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ConsultationSummaryPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"notes" | "prescription" | "summary" | "lifestyle">("notes");
  const [consultation, setConsultation] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      try {
        // Fetch consultation details
        const consData = await api.getConsultations({ appointmentId: resolvedParams.appointmentId });
        if (consData && consData.length > 0) {
          setConsultation(consData[0]);
        }

        // Fetch appointment details from API
        const allApts = await api.getAppointments();
        const apt = allApts.find((a: any) => a.id === resolvedParams.appointmentId || a._id === resolvedParams.appointmentId);
        if (apt) {
          setAppointment(apt);
        } else {
          toast.error("Appointment details not found.");
        }
      } catch (err) {
        console.error("Failed to fetch summary data", err);
        toast.error("Failed to load consultation summary.");
      }
    };
    initData();
  }, [router, resolvedParams.appointmentId]);

  if (!user || !consultation || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading consultation summary...</p>
        </div>
      </div>
    );
  }

  const languageCode = consultation.language || "en";
  const language = languages.find((l) => l.code === languageCode);

  const translations: Record<string, any> = {
    hi: {
      completed: "परामर्श पूरा हुआ", langLabel: "भाषा", title: "परामर्श सारांश", patient: "रोगी", transcript: "प्रतिलेख", back: "डैशबोर्ड पर वापस जाएं",
      tabs: { notes: "डॉक्टर के नोट्स", prescription: "नुस्खा", summary: "रोगी सारांश", lifestyle: "जीवनशैली युक्तियाँ" },
      buttons: { downloadPdf: "डाउनलोड PDF", print: "प्रिंट", sendPatient: "रोगी को भेजें", sendReminders: "अनुस्मारक भेजें" }
    },
    te: {
      completed: "సంప్రదింపు పూర్తయింది", langLabel: "భాష", title: "సంప్రదింపు సారాంశం", patient: "రోగి", transcript: "ట్రాన్స్‌క్రిప్ట్", back: "డాష్‌బోర్డ్‌కి తిరిగి వెళ్ళండి",
      tabs: { notes: "డాక్టర్ నోట్స్", prescription: "ప్రిస్క్రిప్షన్", summary: "రోగి సారాంశం", lifestyle: "జీవనశైలి చిట్కాలు" },
      buttons: { downloadPdf: "PDF డౌన్‌లోడ్", print: "ప్రింట్", sendPatient: "రోగికి పంపండి", sendReminders: "రిమైండర్‌లు పంపండి" }
    },
    ta: {
      completed: "ஆலோசனை முடிந்தது", langLabel: "மொழி", title: "ஆலோசனை சுருக்கம்", patient: "நோயாளி", transcript: "டிரான்ஸ்கிரிப்ட்", back: "டாஷ்போர்டிற்குச் செல்லவும்",
      tabs: { notes: "மருத்துவர் குறிப்புகள்", prescription: "மருந்துச் சீட்டு", summary: "நோயாளி சுருக்கம்", lifestyle: "வாழ்க்கை முறை குறிப்புகள்" },
      buttons: { downloadPdf: "PDF பதிவிறக்கம்", print: "அச்சிடுக", sendPatient: "நோயாளிக்கு அனுப்பு", sendReminders: "நினைவூட்டல்களை அனுப்பு" }
    },
    bn: {
      completed: "পরামর্শ সম্পন্ন হয়েছে", langLabel: "ভাষা", title: "পরামর্শ সারাংশ", patient: "রোগী", transcript: "ট্রান্সক্রিপ্ট", back: "ড্যাশবোর্ডে ফিরে যান",
      tabs: { notes: "ডাক্তারের নোট", prescription: "প্রেসক্রিপশন", summary: "রোগীর সারাংশ", lifestyle: "জীবনধারা টিপস" },
      buttons: { downloadPdf: "PDF ডাউনলোড করুন", print: "প্রিন্ট", sendPatient: "রোগীকে পাঠান", sendReminders: "রিমাইন্ডার পাঠান" }
    },
    en: {
      completed: "Consultation Completed", langLabel: "Language", title: "Consultation Summary", patient: "Patient", transcript: "Consultation Transcript", back: "Back to Dashboard",
      tabs: { notes: "Doctor's Notes", prescription: "Prescription", summary: "Patient Summary", lifestyle: "Lifestyle Tips" },
      buttons: { downloadPdf: "Download PDF", print: "Print", sendPatient: "Send to Patient", sendReminders: "Send Reminders" }
    }
  };

  const t = translations[languageCode] || translations["en"];

  const handleDownloadPDF = (type: string, content: string) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Blue color
    doc.text("MEDISCRIBE AI", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Official Medical Report", 105, 28, { align: "center" });

    doc.line(20, 32, 190, 32); // Horizontal line

    // Info Section
    doc.setFontSize(10);
    doc.setTextColor(0);

    doc.text(`Patient Name: ${appointment.patientName}`, 20, 45);
    doc.text(`Patient ID: ${appointment.patientId}`, 20, 50);

    doc.text(`Doctor: ${appointment.doctorName}`, 130, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 130, 50);
    doc.text(`Report Type: ${type.toUpperCase()}`, 130, 55);

    doc.line(20, 60, 190, 60);

    // Content Section
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text(type, 20, 75);

    doc.setFontSize(11);
    doc.setTextColor(0);

    const splitText = doc.splitTextToSize(content, 170);
    doc.text(splitText, 20, 85);

    // Lifestyle Recommendations (only if downloading summary)
    if (type === 'Summary' && consultation.lifestyleRecommendations?.length > 0) {
      let yPos = 85 + (splitText.length * 5) + 20;

      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text("Lifestyle Recommendations", 20, yPos);

      doc.setFontSize(11);
      doc.setTextColor(0);
      yPos += 10;

      consultation.lifestyleRecommendations.forEach((rec: string, i: number) => {
        doc.text(`${i + 1}. ${rec}`, 20, yPos);
        yPos += 7;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Generated securely by MediScribe AI. This is a computer generated document.", 105, 280, { align: "center" });

    doc.save(`${appointment.patientName}_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success(`${type} PDF downloaded successfully!`);
  };

  const handleSendToPatient = async () => {
    setIsSending(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setIsSending(false);
    toast.success(`Reports sent to ${appointment.patientName} successfully!`);
  };

  const handleSendReminders = async () => {
    setIsSending(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSending(false);
    toast.success("Lifestyle reminders scheduled and sent to patient!");
  };

  const tabs = [
    { id: "notes", label: t.tabs.notes, icon: "📋" },
    { id: "prescription", label: t.tabs.prescription, icon: "💊" },
    { id: "summary", label: t.tabs.summary, icon: "📄" },
    { id: "lifestyle", label: t.tabs.lifestyle, icon: "🌟" },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold">M</div>
          <span className="font-bold text-lg">MediScribe AI</span>
        </Link>
        <Link href={user.role === "patient" ? "/patient/dashboard" : "/doctor/dashboard"} className="text-slate-400 hover:text-white font-medium transition-colors">
          {t.back}
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1">
        <div className="mb-12 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">{t.completed}</span>
              <span>•</span>
              <span>{new Date(consultation.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{t.langLabel}: {language?.name}</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
            <p className="text-slate-400 text-lg">{t.patient}: <span className="text-white font-medium">{appointment.patientName}</span></p>
          </div>
          {user.role === 'doctor' && (
            <button
              onClick={handleSendToPatient}
              disabled={isSending}
              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "✉️"}
              {t.buttons.sendPatient}
            </button>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="flex p-4 gap-2 bg-slate-800/80 border-b border-slate-700/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-4 rounded-3xl text-sm font-bold transition-all flex items-center justify-center gap-3 ${activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-10 min-h-[400px]">
            {activeTab === "notes" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-900/50 rounded-[32px] p-8 font-sans text-base whitespace-pre-wrap leading-relaxed text-slate-300 border border-slate-700/50 shadow-inner">
                  {consultation.doctorNotes}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleDownloadPDF('Notes', consultation.doctorNotes)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">{t.buttons.downloadPdf}</button>
                  <button onClick={() => window.print()} className="px-8 py-4 bg-slate-700 text-white rounded-2xl font-bold hover:bg-slate-600 transition-all">{t.buttons.print}</button>
                </div>
              </div>
            )}
            {activeTab === "prescription" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-indigo-500/5 rounded-[32px] p-8 font-mono text-base whitespace-pre-wrap leading-relaxed text-indigo-100 border border-indigo-500/20 shadow-inner">
                  {consultation.prescription}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleDownloadPDF('Prescription', consultation.prescription)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">{t.buttons.downloadPdf}</button>
                  <button onClick={() => window.print()} className="px-8 py-4 bg-slate-700 text-white rounded-2xl font-bold hover:bg-slate-600 transition-all">{t.buttons.print}</button>
                </div>
              </div>
            )}
            {activeTab === "summary" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-emerald-500/5 rounded-[32px] p-8 text-base whitespace-pre-wrap leading-relaxed text-emerald-100 border border-emerald-500/20 shadow-inner">
                  {consultation.patientSummary}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleDownloadPDF('Summary', consultation.patientSummary)} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">{t.buttons.downloadPdf}</button>
                  <button onClick={() => window.print()} className="px-8 py-4 bg-slate-700 text-white rounded-2xl font-bold hover:bg-slate-600 transition-all">{t.buttons.print}</button>
                </div>
              </div>
            )}
            {activeTab === "lifestyle" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {consultation.lifestyleRecommendations?.length > 0 ? (
                  <>
                    <div className="grid gap-4">
                      {consultation.lifestyleRecommendations.map((rec: string, i: number) => (
                        <div key={i} className="flex items-center gap-6 p-6 bg-amber-500/5 rounded-[28px] border border-amber-500/20 shadow-sm group hover:bg-amber-500/10 transition-colors">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">{i + 1}</div>
                          <p className="text-lg text-amber-50 group-hover:text-white transition-colors">{rec}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8">
                      <button
                        onClick={handleSendReminders}
                        disabled={isSending}
                        className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                      >
                        {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "🔔"}
                        {t.buttons.sendReminders}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center">
                    <div className="text-6xl mb-4 opacity-20">🌟</div>
                    <p className="text-slate-500 italic">No specific recommendations detected from conversation.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 bg-slate-800/30 rounded-[40px] border border-slate-700/50 p-10 shadow-xl backdrop-blur-md">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-8">{t.transcript}</h3>
          <div className="bg-slate-900/80 rounded-[32px] p-8 max-h-[500px] overflow-y-auto border border-slate-700/50 shadow-inner custom-scrollbar">
            <pre className="text-sm text-slate-400 whitespace-pre-wrap font-sans leading-[2.2]">{consultation.transcript}</pre>
          </div>
        </div>
      </main>

      <footer className="py-12 text-center text-slate-600 text-xs border-t border-slate-800/50 mt-auto">
        © 2025 MediScribe AI • Secure AI Consultation History
      </footer>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}
