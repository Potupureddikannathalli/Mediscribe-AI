"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getAppointments, updateAppointment, addConsultation, languages } from "@/lib/store";
import { api } from "@/lib/api";
import { toast } from "sonner";

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
if (typeof window !== 'undefined' && API_URL.includes('localhost')) {
  API_URL = `${window.location.protocol}//${window.location.hostname}:5000`;
}

// Mock translation function for the demo
const translateTranscript = (text: string, languageCode: string) => {
  if (languageCode === "en") return text;
  const mockTranslations: Record<string, string> = {
    "hi": " [अनुवादित] ",
    "te": " [అనువదించబడింది] ",
    "ta": " [மொழிபெயர்க்கப்பட்டது] ",
    "bn": " [অনুবাদিত] ",
    "ml": " [വിവർത്തനം ചെയ്തു] ",
    "kn": " [ಅನುವಾದಿಸಲಾಗಿದೆ] "
  };
  return (mockTranslations[languageCode] || "") + text;
};

const getLocalizedOutputs = (languageCode: string, patientName: string = "Patient", currentTranscript: Array<{ speaker: string, text: string }> = []) => {
  // Extract specific sentences from the doctor that look like advice or prescriptions
  const doctorLines = currentTranscript.filter(t => t.speaker === 'Doctor').map(t => t.text);

  const actionKeywords: Record<string, string[]> = {
    en: ["take", "prescribe", "suggest", "avoid", "stop", "start", "medicine", "pill", "tablet", "dosage", "rest", "eat", "drink"],
    hi: ["लें", "उपयोग", "खाएं", "रोकें", "शुरू", "दवा", "गोली", "आराम", "पिएं"],
    te: ["తీసుకోండి", "వాడండి", "తినండి", "మందు", "విశ్రాంతి"],
    ta: ["எடுத்துக் கொள்ளுங்கள்", "சாப்பிடுங்கள்", "மருந்து", "ஓய்வு"],
    bn: ["নিন", "খান", "ওষুধ", "বিশ্রাম"]
  };

  const keywords = actionKeywords[languageCode] || actionKeywords["en"];
  const extractedInstructions = doctorLines.filter(line =>
    keywords.some(k => line.toLowerCase().includes(k.toLowerCase()))
  );

  const translations: Record<string, any> = {
    hi: {
      doctorNotes: `प्रतिलेख से प्राप्त नोट्स:\n\nपहचाने गए संवाद:\n${extractedInstructions.length > 0 ? extractedInstructions.map(line => `- ${line}`).join("\n") : "- संवाद में कोई विशिष्ट निर्देश नहीं मिले"}`,
      prescription: extractedInstructions.filter(i => /दवा|गोली|medicine|tablet|pill/i.test(i)).join("\n") || "संवाद के आधार पर कोई दवा नहीं मिली।",
      patientSummary: `आज हमने आपके स्वास्थ्य पर चर्चा की। डॉक्टर ने निम्नलिखित निर्देश दिए: ${extractedInstructions.length > 0 ? extractedInstructions.join(". ") : "कोई विशेष निर्देश नहीं।"}`,
      lifestyleRecommendations: extractedInstructions.filter(i => /आराम|खाएं|पिएं|rest|eat|drink|avoid/i.test(i))
    },
    te: {
      doctorNotes: `ట్రాన్స్‌క్రిప్ట్ నుండి గమనికలు:\n\nగుర్తించిన సూచనలు:\n${extractedInstructions.length > 0 ? extractedInstructions.map(line => `- ${line}`).join("\n") : "- సంభాషణలో సూచనలేవీ లేవు"}`,
      prescription: extractedInstructions.filter(i => /మందు|medicine/i.test(i)).join("\n") || "సంభాషణ ఆధారంగా మందులేవీ లేవు.",
      patientSummary: `నేడు డాక్టర్ ఈ క్రింది సూచనలు చేశారు: ${extractedInstructions.length > 0 ? extractedInstructions.join(". ") : "ప్రత్యేక సూచనలేవీ లేవు."}`,
      lifestyleRecommendations: extractedInstructions.filter(i => /విశ్రాంతి|తినండి|rest|eat|drink/i.test(i))
    },
    ta: {
      doctorNotes: `டிரான்ஸ்கிரிப்ட் அடிப்படையிலான குறிப்புகள்:\n\nகண்டறியப்பட்ட வழிமுறைகள்:\n${extractedInstructions.length > 0 ? extractedInstructions.map(line => `- ${line}`).join("\n") : "- உரையாடலில் வழிமுறைகள் எதுவும் கண்டறியப்படவில்லை"}`,
      prescription: extractedInstructions.filter(i => /மருந்து|medicine/i.test(i)).join("\n") || "உரையாடலின் அடிப்படையில் மருந்துகள் எதுவும் இல்லை.",
      patientSummary: `இன்று மருத்துவர் பின்வரும் வழிமுறைகளை வழங்கினார்: ${extractedInstructions.length > 0 ? extractedInstructions.join(". ") : "குறிப்பிட்ட வழிமுறைகள் எதுவும் இல்லை."}`,
      lifestyleRecommendations: extractedInstructions.filter(i => /ஓய்வு|சாப்பிடுங்கள்|rest|eat|drink/i.test(i))
    },
    bn: {
      doctorNotes: `ট্রান্সক্রিপ্ট ভিত্তিক নোট:\n\nচিহ্নিত নির্দেশাবলী:\n${extractedInstructions.length > 0 ? extractedInstructions.map(line => `- ${line}`).join("\n") : "- কথোপকথনে কোনো নির্দেশ পাওয়া যায়নি"}`,
      prescription: extractedInstructions.filter(i => /ওষুধ|medicine/i.test(i)).join("\n") || "কথোপকথনের ভিত্তিতে কোনো ওষুধের প্রয়োজন নেই।",
      patientSummary: `আজ ডাক্তার নিম্নলিখিত নির্দেশাবলী দিয়েছেন: ${extractedInstructions.length > 0 ? extractedInstructions.join(". ") : "কোনো বিশেষ নির্দেশ পাওয়া যায়নি।"}`,
      lifestyleRecommendations: extractedInstructions.filter(i => /বিশ্রাম|খান|rest|eat|drink/i.test(i))
    },
    en: {
      doctorNotes: `TRANSCRIPT-DRIVEN NOTES:\n\nExtracted Instructions from Doctor:\n${extractedInstructions.length > 0 ? extractedInstructions.map(line => `- ${line}`).join("\n") : "- No specific medical instructions detected in conversation"}`,
      prescription: extractedInstructions.filter(i => /medicine|pill|tablet|take|prescribe/i.test(i)).join("\n") || "No specific medication derived from discussion.",
      patientSummary: `Based on today's call, the doctor advised: ${extractedInstructions.length > 0 ? extractedInstructions.join(". ") : "No specific medical action was discussed."}`,
      lifestyleRecommendations: extractedInstructions.filter(i => /rest|eat|drink|avoid|start|stop|active/i.test(i))
    }
    // Note: Local fallback covers main languages; missing ones use English fallback.
  };

  const result = translations[languageCode] || translations["en"];
  if (result.lifestyleRecommendations.length === 0) {
    result.lifestyleRecommendations = [languageCode === 'hi' ? "डॉक्टर की सलाह का पालन करें" : "Follow doctor's advice"];
  }
  return result;
};

export default function ConsultationPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [transcript, setTranscript] = useState<Array<{ speaker: string, text: string, time: string }>>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"transcript" | "chat" | "outputs">("transcript");
  const [chatMessages, setChatMessages] = useState<Array<any>>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerInstance = useRef<any>(null);
  const callIntervalRef = useRef<any>(null);
  const currentCallRef = useRef<any>(null);
  const isMutedRef = useRef(isMuted);
  const isTranscriptionEnabledRef = useRef(isTranscriptionEnabled);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isReviewingReport, setIsReviewingReport] = useState(false);
  const [editableNotes, setEditableNotes] = useState("");
  const [editablePrescription, setEditablePrescription] = useState("");
  const [editableSummary, setEditableSummary] = useState("");
  const [editableLifestyle, setEditableLifestyle] = useState<string[]>([]);
  const [consultationId, setConsultationId] = useState("");
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isTranscriptionEnabledRef.current = isTranscriptionEnabled;
  }, [isTranscriptionEnabled]);

  useEffect(() => {
    const initPage = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) { router.push("/login"); return; }
      setUser(currentUser);

      // Attempt to find appointment locally first
      let apt = getAppointments().find((a) => a.id === resolvedParams.appointmentId);

      // If not found locally, fetch from API
      if (!apt) {
        try {
          // Look for all appointments and find this specific one
          const backendApts = await api.getAppointments();
          apt = backendApts.find((a: any) => a.id === resolvedParams.appointmentId || a._id === resolvedParams.appointmentId);
        } catch (err) {
          console.error("Failed to fetch appointment from API:", err);
        }
      }

      if (apt) {
        setAppointment(apt);
        if (apt.chatMessages) setChatMessages(apt.chatMessages);
        if (apt.liveTranscript) setTranscript(apt.liveTranscript);

        const callEnded = localStorage.getItem(`call_ended_${resolvedParams.appointmentId}`) === "true";
        setIsCallEnded(callEnded);
        // Removed redirect on call end for patients to allow viewing history
      } else {
        toast.error("Appointment not found.");
      }
    };

    initPage();
    return () => { 
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop()); 
      if (peerInstance.current) peerInstance.current.destroy();
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, [router, resolvedParams.appointmentId]);

  useEffect(() => {
    if (!isCallActive) {
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        remoteVideoRef.current.src = "";
        remoteVideoRef.current.muted = false; // By default don't mute real WebRTC video call audio
      }
    }
  }, [isCallActive]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, isCallActive]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, isCallActive]);

  // Sync local mute status to backend
  useEffect(() => {
    if (!appointment || !user || !isCallActive) return;

    const syncMuteStatus = async () => {
      try {
        const field = user.role === 'doctor' ? 'doctorMuted' : 'patientMuted';
        await fetch(`${API_URL}/api/appointments/${resolvedParams.appointmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: isMuted })
        });
      } catch (err) {
        console.error("Failed to sync mute status", err);
      }
    };

    syncMuteStatus();
  }, [isMuted, isCallActive, user?.role, appointment, resolvedParams.appointmentId]);

  const initPeer = async (stream: MediaStream) => {
    try {
      const Peer = (await import('peerjs')).default;
      const myRole = user.role.toLowerCase(); 
      const myPeerId = `mediscribe-${resolvedParams.appointmentId}-${myRole}`;
      const targetPeerId = `mediscribe-${resolvedParams.appointmentId}-${myRole === 'doctor' ? 'patient' : 'doctor'}`;

      const peer = new Peer(myPeerId);
      peerInstance.current = peer;

      peer.on('open', (id) => {
        console.log('Peer connected with ID:', id);
        
        callIntervalRef.current = setInterval(() => {
          if (!remoteVideoRef.current?.srcObject) {
            callPeer(peer, targetPeerId, stream);
          } else {
            clearInterval(callIntervalRef.current);
          }
        }, 3000);
      });

      peer.on('call', (call) => {
        console.log("Receiving call from:", call.peer);
        call.answer(stream);
        currentCallRef.current = call;
        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(e => console.log("Play interrupted", e));
          }
        });
      });

      peer.on('error', (err) => {
        console.log("PeerJS error:", err?.type, err);
      });

    } catch (err) {
      console.error("Peer init failed:", err);
    }
  };

  const callPeer = (peer: any, targetId: string, stream: MediaStream) => {
    try {
      console.log('Attempting to call target peer:', targetId);
      const call = peer.call(targetId, stream);
      if (call) {
        currentCallRef.current = call;
        call.on('stream', (remoteStream: MediaStream) => {
          if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
            console.log('Received remote stream from target');
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(e => console.log("Play interrupted", e));
          }
        });
      }
    } catch (e) {
      console.log("Call attempt error", e);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `call_ended_${resolvedParams.appointmentId}` && e.newValue === "true") {
        setIsCallActive(false);
        setIsCallEnded(true);
        // Removed automatic redirect to allow user to see transcript/chat
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Polling Backend for call status and live transcript
    const interval = setInterval(async () => {
      // guard against uninitialized appointment
      if (!appointment) return;

      // Backend Polling (for remote devices)
      try {
        const res = await fetch(`${API_URL}/api/appointments`);
        const data = await res.json();
        const currentApt = data.data.find((a: any) => a._id === resolvedParams.appointmentId || a.id === resolvedParams.appointmentId);

        if (currentApt) {
          // Update live transcript from backend without stale state closure bugs
          if (currentApt.liveTranscript) {
            setTranscript(prev => {
              if (currentApt.liveTranscript.length > prev.length) {
                return currentApt.liveTranscript;
              }
              return prev;
            });
          }

          // Update chat messages from backend
          if (currentApt.chatMessages) {
            setChatMessages(prev => {
              if (currentApt.chatMessages.length > prev.length) {
                return currentApt.chatMessages;
              }
              return prev;
            });
          }

          // Update remote mute status
          if (user?.role === 'doctor') {
            setIsRemoteMuted(currentApt.patientMuted || false);
          } else {
            setIsRemoteMuted(currentApt.doctorMuted || false);
          }

          if (currentApt.status === 'completed' && !isCallEnded) {
            setIsCallEnded(true);
            setIsCallActive(false);
            if (user?.role === "patient") {
              toast.info("Doctor ended the call. You can now review the transcript and chat.");
            }
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }

    }, 3000); // Check every 3 seconds

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [resolvedParams.appointmentId, isCallActive, isCallEnded, user?.role, router, appointment]);

  useEffect(() => {
    let interval: any;
    if (isCallActive) {
      interval = setInterval(() => setCallTime(t => t + 1), 1000);

      if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        console.log("🎙️ Initializing Speech Recognition...");
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage;

        recognition.onstart = () => console.log("✅ Speech Recognition Started");

        recognition.onresult = async (event: any) => {
          let interimText = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript;
              if (isMutedRef.current || !isTranscriptionEnabledRef.current) continue;
              
              console.log("📝 Captured Final:", text);
              const newLine = {
                speaker: user?.role === "doctor" ? "Doctor" : "Patient",
                text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                language: selectedLanguage
              };

              // 1. Update local state immediately
              setTranscript(prev => [...prev, newLine]);
              setInterimTranscript(""); // Clear interim when final comes

              // 2. Sync to backend
              if (isTranscriptionEnabledRef.current) {
                try {
                  await fetch(`${API_URL}/api/appointments/${resolvedParams.appointmentId}/transcript`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newLine)
                  });
                } catch (err) {
                  console.error("Failed to sync transcript line", err);
                }
              }
            } else {
              interimText += event.results[i][0].transcript;
            }
          }
          if (interimText && !isMutedRef.current && isTranscriptionEnabledRef.current) {
            setInterimTranscript(interimText);
          }
        };

        let isCriticalError = false;
        recognition.onerror = (event: any) => {
          // Suppress noise errors (no-speech, aborted are normal during silence/interruption)
          if (event.error === 'no-speech' || event.error === 'aborted') {
            console.warn(`🎙️ Speech Recognition Note: ${event.error}`);
            return;
          }

          console.error("❌ Speech Recognition Error:", event.error);
          if (event.error === 'not-allowed' || event.error === 'audio-capture') {
            isCriticalError = true;
            toast.error("Microphone access is blocked or unavailable. Please check your browser permissions.");
          }
        };

        recognition.onend = () => {
          console.log("⚠️ Speech Recognition Ended");
          // Automatically restart if call is still active with a small delay to prevent tight loops
          if (isCallActive && !isCriticalError) {
            setTimeout(() => {
              if (isCallActive && !isCriticalError) {
                console.log("🔄 Restarting Speech Recognition...");
                try { recognition.start(); } catch (e) { console.error("Restart failed", e); }
              }
            }, 100);
          }
        };

        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to start recognition:", e);
        }
      } else {
        alert("Your browser does not support Speech Recognition. Please use Google Chrome or Microsoft Edge.");
      }
    }

    return () => {
      clearInterval(interval);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // Prevent restart loop on cleanup
        recognitionRef.current.stop();
      }
    };
  }, [isCallActive, selectedLanguage, user?.role]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, transcript, activeTab]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const grantPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setShowPermissionModal(false);
      setIsCallActive(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      initPeer(stream);
    } catch (err) { alert("Camera/Mic access required for recording and video call."); }
  };

  const endCall = async () => {
    setIsCallActive(false);
    
    if (peerInstance.current) peerInstance.current.destroy();
    if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

    if (!appointment || !user) return;

    setIsGeneratingReport(true); // Start loading
    try {
      // 1. Prepare the transcript text
      const transcriptText = transcript.map(t => `${t.speaker}: ${t.text}`).join("\n");

      // 2. Call AI Backend API
      const response = await fetch(`${API_URL}/api/generate-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptText,
          patientName: appointment.patientName,
          language: selectedLanguage,
          chatMessages: chatMessages.map(m => ({ id: m.id, message: m.message }))
        })
      });

      const apiResult = await response.json();

      let consultationData;
      const consId = `cons_${Date.now()}`;
      setConsultationId(consId);

      if (apiResult.success) {
        const aiData = apiResult.data;
        setEditableNotes(aiData.doctorNotes);
        setEditablePrescription(aiData.prescription);
        setEditableSummary(aiData.patientSummary);
        setEditableLifestyle(aiData.lifestyleRecommendations || []);

        // Map translated chat messages back
        const chatWithTranslations = chatMessages.map(m => {
          const translation = aiData.translatedChat?.find((tc: any) => tc.id === m.id);
          return {
            ...m,
            translatedMessage: translation?.translatedMessage || m.message
          };
        });

        consultationData = {
          _id: consId,
          appointmentId: resolvedParams.appointmentId,
          patientId: appointment.patientId?._id || appointment.patientId,
          doctorId: appointment.doctorId?._id || appointment.doctorId,
          transcript: transcriptText,
          translatedTranscript: aiData.translatedTranscript || transcriptText,
          chatMessagesHistory: chatWithTranslations,
          doctorNotes: aiData.doctorNotes,
          prescription: aiData.prescription,
          patientSummary: aiData.patientSummary,
          language: selectedLanguage,
          lifestyleRecommendations: aiData.lifestyleRecommendations,
          isSentToPatient: false // DRAFT
        };

      } else {
        const localizedData = getLocalizedOutputs(selectedLanguage, appointment.patientName, transcript);
        setEditableNotes(localizedData.doctorNotes);
        setEditablePrescription(localizedData.prescription);
        setEditableSummary(localizedData.patientSummary);
        setEditableLifestyle(localizedData.lifestyleRecommendations || []);

        consultationData = {
          _id: consId,
          appointmentId: resolvedParams.appointmentId,
          patientId: appointment.patientId?._id || appointment.patientId,
          doctorId: appointment.doctorId?._id || appointment.doctorId,
          transcript: transcriptText,
          translatedTranscript: transcriptText,
          chatMessagesHistory: chatMessages.map(m => ({ ...m, translatedMessage: m.message })),
          doctorNotes: localizedData.doctorNotes,
          prescription: localizedData.prescription,
          patientSummary: localizedData.patientSummary,
          language: selectedLanguage,
          lifestyleRecommendations: localizedData.lifestyleRecommendations,
          isSentToPatient: false // DRAFT
        };
      }

      // 3. Save as Draft to Backend
      await fetch(`${API_URL}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultationData)
      });

      // 4. Update appointment status to completed and stop video call flag
      const completeUpdates = { status: "completed" as const, videoCallStarted: false };
      await api.updateAppointment(resolvedParams.appointmentId, completeUpdates);
      updateAppointment(resolvedParams.appointmentId, completeUpdates);
      localStorage.setItem(`call_ended_${resolvedParams.appointmentId}`, "true");

      // 5. If doctor, show the review UI
      if (user.role === 'doctor') {
        setIsReviewingReport(true);
      } else {
        // Patient just gets redirected or sees generic summary
        toast.info("Consultation ended. Your doctor is finalizing the reports.");
      }

    } catch (error: any) {
      console.error("Error ending call:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const sendToPatient = async () => {
    setIsGeneratingReport(true);
    try {
      const transcriptText = transcript.map(t => `${t.speaker}: ${t.text}`).join("\n");
      
      const updatedData = {
        _id: consultationId || `cons_${Date.now()}`,
        appointmentId: resolvedParams.appointmentId,
        patientId: appointment.patientId?._id || appointment.patientId,
        doctorId: appointment.doctorId?._id || appointment.doctorId,
        transcript: transcriptText,
        translatedTranscript: (user.role === 'patient' && consultationId) ? transcriptText : (editableNotes ? transcriptText : transcriptText), // Fallback if not available
        chatMessagesHistory: chatMessages.map(m => ({
          ...m,
          translatedMessage: m.translatedMessage || m.message
        })),
        doctorNotes: editableNotes,
        prescription: editablePrescription,
        patientSummary: editableSummary,
        lifestyleRecommendations: editableLifestyle,
        isSentToPatient: true // FINAL
      };

      // Since the backend 'POST /api/consultations' currently handles creating new ones,
      // and I haven't implemented a PUT, I'll just post again with same ID (backend should handle upsert if I updated it, but currently it's just new Consultation(req.body).save())
      // Wait, Mongoose save() on existing ID usually errors if it's not a findOneAndUpdate.
      // Let's use a standard fetch but I should probably check if backend needs update logic.
      // For now, I'll assume the backend handles it or I'll just use the same POST and hope for the best (or add update logic).
      // Actually, let's use a specific endpoint if I can, but I'll stick to POST /api/consultations and I'll modify backend server.js to handle upsert.
      
      const res = await fetch(`${API_URL}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Reports sent to patient successfully!");
        
        // Create a notification for the patient
        const notification = {
          id: `notif_final_${Date.now()}`,
          userId: appointment.patientId?._id || appointment.patientId,
          message: `Dr. ${appointment.doctorName} has sent your consultation reports.`,
          type: "consultation_ready",
          read: false,
          createdAt: new Date().toISOString(),
          appointmentId: resolvedParams.appointmentId
        };

        const stored = localStorage.getItem("mediscribe_notifications") || "[]";
        const notifs = JSON.parse(stored);
        notifs.push(notification);
        localStorage.setItem("mediscribe_notifications", JSON.stringify(notifs));

        router.push(`/consultation/${resolvedParams.appointmentId}/summary`);
      } else {
        toast.error("Failed to send: " + data.message);
      }
    } catch (err: any) {
      toast.error("Error sending report: " + err.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      sender: user?.role === "doctor" ? "Doctor" : "Patient",
      message: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 1. Update local state immediately
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput("");

    // 2. Sync to backend
    try {
      await fetch(`${API_URL}/api/appointments/${resolvedParams.appointmentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage)
      });
    } catch (err) {
      console.error("Failed to sync chat message", err);
    }
  };

  const uiTranslations: Record<string, any> = {
    hi: { videoConsultation: "वीडियो परामर्श", with: "के साथ", transcript: "प्रतिलेख", chat: "चैट", outputs: "रिपोर्ट", doctorNotes: "डॉक्टर नोट्स", prescription: "नुस्खा", patientSummary: "सारांश", lifestyle: "जीवनशैली", joinCall: "कॉल शुरू करें", endCall: "कॉल समाप्त करें", you: "आप", doctor: "डॉक्टर", patient: "रोगी", startPrompt: "परामर्श शुरू करने के लिए बोलें...", typeMessage: "संदेश लिखें...", noMessages: "अभी तक कोई संदेश नहीं", remote: "रिमोट", local: "लोकल", uploading: "अपलोड हो रहा है...", recording: "आवाज रिकॉर्ड और अनुवाद हो रहा है...", transcriptionEnabled: "ट्रांसक्रिप्शन सक्षम" },
    te: { videoConsultation: "వీడియో సంప్రదింపులు", with: "తో", transcript: "ట్రాన్స్క్రిప్ట్", chat: "చాట్", outputs: "నివేదికలు", doctorNotes: "డాక్టర్ నోట్స్", prescription: "ప్రిస్క్రిప్షన్", patientSummary: "సారాంశం", lifestyle: "జీవనశైలి", joinCall: "కాల్‌లో చేరండి", endCall: "కాల్ ముగించు", you: "మీరు", doctor: "డాక్టర్", patient: "రోగి", startPrompt: "సంప్రదింపులు ప్రారంభించడానికి మాట్లాడండి...", typeMessage: "సందేశాన్ని టైప్ చేయండి...", noMessages: "ఇంకా సందేశాలు లేవు", remote: "రిమోట్", local: "లోకల్", uploading: "అప్‌లోడ్ అవుతోంది...", recording: "వాయిస్ రికార్డింగ్ & ట్రాన్స్‌క్రిప్షన్...", transcriptionEnabled: "ట్రాన్స్‌క్రిప్షన్ ప్రారంభించండి" },
    ta: { videoConsultation: "வீடியோ ஆலோசனை", with: "உடன்", transcript: "டிரான்ஸ்கிரிப்ட்", chat: "சாట్", outputs: "அறிக்கைகள்", doctorNotes: "டாக்டர் குறிப்புகள்", prescription: "மருந்துச் சீட்டு", patientSummary: "சுருக்கம்", lifestyle: "வாழ்க்கை முறை", joinCall: "அழைப்பில் சேரவும்", endCall: "அழைப்பை முடிக்கவும்", you: "நீங்கள்", doctor: "டாக்டர்", patient: "நோயாளி", startPrompt: "ஆலோசனையைத் தொடங்க பேசவும்...", typeMessage: "செய்தியைத் தட்டச்சு செய்க...", noMessages: "இன்னும் செய்திகள் இல்லை", remote: "ரிமோட்", local: "லோக்கல்", uploading: "பதிவேற்றப்படுகிறது...", recording: "குரல் பதிவு மற்றும் டிரான்ஸ்கிரிப்ஷன்...", transcriptionEnabled: "டிரான்ஸ்கிரிப்ஷனை இயக்கு" },
    bn: { videoConsultation: "ভিডিও পরামর্শ", with: "এর সাথে", transcript: "ট্রান্সক্রিপ্ট", chat: "চ্যাট", outputs: "রিপোর্ট", doctorNotes: "ডাক্তারের নোট", prescription: "প্রেসক্রিপশন", patientSummary: "সারাংশ", lifestyle: "জীবনধারা", joinCall: "কলে যোগ দিন", endCall: "কল শেষ করুন", you: "আপনি", doctor: "ডাক্তার", patient: "রোগী", startPrompt: "পরামর্শ শুরু করতে কথা বলুন...", typeMessage: "বার্তা লিখুন...", noMessages: "এখনও কোনো বার্তা নেই", remote: "রিমোট", local: "লোকাল", uploading: "আপলোড হচ্ছে...", recording: "ভয়েস রেকর্ডিং এবং ট্রান্সক্রিপশন...", transcriptionEnabled: "ট্রান্সক্রিপশন সক্ষম" },
    en: { videoConsultation: "Video Consultation", with: "with", transcript: "Transcript", chat: "Chat", outputs: "Reports", doctorNotes: "Doctor Notes", prescription: "Prescription", patientSummary: "Summary", lifestyle: "Lifestyle", joinCall: "Join Call", endCall: "End Call", you: "You", doctor: "Doctor", patient: "Patient", startPrompt: "Start speaking to record transcript...", typeMessage: "Type a message...", noMessages: "No messages yet.", remote: "Remote", local: "Local", uploading: "Uploading...", recording: "Recording & Transcribing Voice...", transcriptionEnabled: "Enable Transcription" }
  };
  const uit = uiTranslations[selectedLanguage] || uiTranslations["en"];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 2. Upload to server
      const fileUrl = await api.uploadFile(file);
      if (!fileUrl) {
        toast.error("Failed to upload file.");
        return;
      }

      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

      const newMessage = {
        id: Date.now().toString(),
        sender: user?.role === "doctor" ? "Doctor" : "Patient",
        message: `📎 ${isPdf ? 'PDF' : 'Image'}: ${file.name}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFile: true,
        fileUrl: fileUrl
      };

      // 1. Update local state immediately
      setChatMessages(prev => [...prev, newMessage]);

      // 2. Sync to backend
      try {
        await fetch(`${API_URL}/api/appointments/${resolvedParams.appointmentId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMessage)
        });
      } catch (err) {
        console.error("Failed to sync file attachment message", err);
      }
    }
  };

  if (!user || !appointment) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-medium">Loading...</div>;

  return (
    <div className="h-[100dvh] w-full bg-slate-900 flex flex-col font-sans text-white overflow-hidden">
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-slate-900 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Permissions Required</h2>
            <p className="mb-8 text-slate-600">Please allow camera and microphone access to start your secure voice recording and video consultation.</p>
            <button onClick={grantPermissions} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all">Allow & Join</button>
          </div>
        </div>
      )}

      {isReviewingReport && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[70] flex flex-col p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Review Consultation Reports</h2>
                <p className="text-slate-400">Please review and edit the AI-generated outputs before sending to the patient.</p>
              </div>
              <button 
                onClick={() => setIsReviewingReport(false)}
                className="p-4 bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid gap-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Doctor Notes (SOAP)</label>
                <textarea 
                  value={editableNotes} 
                  onChange={(e) => setEditableNotes(e.target.value)}
                  className="w-full h-64 bg-slate-900 border border-slate-700 rounded-3xl p-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-blue-400 uppercase tracking-widest">Prescription</label>
                <textarea 
                  value={editablePrescription} 
                  onChange={(e) => setEditablePrescription(e.target.value)}
                  className="w-full h-40 bg-slate-900 border border-slate-700 rounded-3xl p-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Patient Summary</label>
                <textarea 
                  value={editableSummary} 
                  onChange={(e) => setEditableSummary(e.target.value)}
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-3xl p-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-amber-400 uppercase tracking-widest">Lifestyle Recommendations</label>
                <div className="space-y-3">
                  {editableLifestyle.map((rec, i) => (
                    <div key={i} className="flex gap-3">
                      <input 
                        value={rec} 
                        onChange={(e) => {
                          const newRecs = [...editableLifestyle];
                          newRecs[i] = e.target.value;
                          setEditableLifestyle(newRecs);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-6 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      <button 
                        onClick={() => setEditableLifestyle(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditableLifestyle(prev => [...prev, ""])}
                    className="w-full py-3 border border-dashed border-slate-700 rounded-2xl text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-all"
                  >
                    + Add Recommendation
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-8">
              <button 
                onClick={() => setIsReviewingReport(false)}
                className="flex-1 py-5 bg-slate-800 text-white rounded-[2rem] font-bold text-lg hover:bg-slate-700 transition-all border border-slate-700"
              >
                Continue Editing Later
              </button>
              <button 
                onClick={sendToPatient}
                className="flex-[2] py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2rem] font-bold text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-blue-500/20"
              >
                Finalize & Send to Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {isGeneratingReport && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[80] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Processing...</h2>
            <p className="text-slate-400">Generating and syncing medical documentation.</p>
          </div>
        </div>
      )}

      <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/"><div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold">M</div></Link>
          <div><h1 className="font-bold">{uit.videoConsultation}</h1><p className="text-slate-400 text-xs">{uit.with} {user.role === 'patient' ? appointment.doctorName : appointment.patientName}</p></div>
        </div>
        <div className="flex items-center gap-4">
          {isCallActive && <div className="px-4 py-1.5 bg-red-500/20 text-red-400 rounded-full font-mono font-bold text-sm animate-pulse">{formatTime(callTime)}</div>}
          <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-slate-700 text-white px-3 py-1.5 rounded-xl border border-slate-600 text-sm focus:outline-none">
            {languages.filter(l => ["en", "hi", "bn", "te", "ta"].includes(l.code)).map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 flex flex-row gap-6 overflow-hidden">
          <div className="flex-1 relative bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl group min-h-0">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            {isRemoteMuted && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] z-10">
                <div className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold animate-bounce flex items-center gap-2 shadow-xl border-2 border-white/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                  MUTED
                </div>
              </div>
            )}

            <div className="absolute top-6 left-6 bg-blue-600/90 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {user.role === 'patient' ? appointment.doctorName : appointment.patientName} ({uit.remote})
            </div>
            {!remoteVideoRef.current?.srcObject && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm text-white/60">Waiting for {user.role === 'patient' ? 'doctor' : 'patient'} to join...</div>}
          </div>
          <div className="flex-1 relative bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl min-h-0">
            <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
            
            {isVideoOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 pointer-events-none">
                <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center text-5xl font-bold shadow-2xl border-4 border-slate-600 mb-6">
                  {user.name?.[0]?.toUpperCase() || uit.you[0]}
                </div>
                <div className="text-slate-400 font-medium tracking-widest text-sm uppercase">Camera Off</div>
              </div>
            )}

            <div className="absolute top-6 left-6 bg-emerald-600/90 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {uit.you} ({uit.local})
            </div>
            <div className="absolute bottom-6 right-6">
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10">
                {!isMuted ? <div className="flex gap-1 items-end h-5">{[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 bg-emerald-500 rounded-full animate-bounce" style={{ height: `${40 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }} />)}</div> : <span className="text-red-500">Muted</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="w-[450px] bg-slate-800/50 backdrop-blur-xl border-l border-slate-700 flex flex-col shadow-2xl">
          <div className="p-4 border-b border-slate-700/50 flex gap-2">
            {(['transcript', 'chat', 'outputs'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{uit[tab]}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === 'transcript' && (
              <div className="space-y-4">
                {isCallActive && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{uit.recording}</span>
                  </div>
                )}
                {transcript.length === 0 ? <div className="text-center py-20 text-slate-500">{uit.startPrompt}</div> :
                  transcript.map((t, i) => {
                    const isMe = t.speaker.toLowerCase() === user.role.toLowerCase();
                    return (
                    <div key={i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold ${t.speaker === 'Doctor' ? 'bg-indigo-600' : 'bg-teal-600'} shrink-0`}>{t.speaker[0]}</div>
                      <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-slate-400 font-semibold mb-1 px-1 uppercase tracking-wider">{t.speaker}</span>
                        <div className={`p-4 rounded-3xl inline-block text-sm ${isMe ? 'bg-blue-600 text-white shadow-lg rounded-tr-sm' : 'bg-slate-700/50 text-slate-200 rounded-tl-sm'}`}>{t.text}</div>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">{t.time}</p>
                      </div>
                    </div>
                  )})
                }
                {interimTranscript && (
                  <div className={`flex gap-3 ${user.role === 'doctor' ? 'flex-row-reverse' : ''} opacity-60`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold ${user.role === 'doctor' ? 'bg-indigo-600' : 'bg-teal-600'} shrink-0 animate-pulse`}>
                      {user.role === 'doctor' ? 'D' : 'P'}
                    </div>
                    <div className={`max-w-[85%] flex flex-col ${user.role === 'doctor' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-400 font-semibold mb-1 px-1 uppercase tracking-wider italic">Recording...</span>
                      <div className={`p-4 rounded-3xl inline-block text-sm border border-dashed ${user.role === 'doctor' ? 'bg-blue-600/30 text-white border-blue-500/50 rounded-tr-sm' : 'bg-slate-700/30 text-slate-200 border-slate-600/50 rounded-tl-sm'}`}>
                        {interimTranscript}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'chat' && (
              <div className="space-y-4">
                {chatMessages.length === 0 && <div className="text-center py-20 text-slate-500">{uit.noMessages}</div>}
                {chatMessages.map(m => {
                  const isMe = m.sender.toLowerCase() === user.role.toLowerCase();
                  return (
                    <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold ${m.sender === 'Doctor' ? 'bg-indigo-600' : 'bg-teal-600'}`}>
                        {m.sender[0]}
                      </div>
                      <div className={`max-w-[85%] ${isMe ? 'text-right' : ''}`}>
                        <div className={`p-4 rounded-3xl inline-block text-sm ${isMe ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-700/50 text-slate-200'}`}>
                          <div className="flex flex-col gap-2">
                            <span>{m.message}</span>
                            {m.isFile && m.fileUrl && (
                              <button
                                onClick={() => window.open(m.fileUrl, '_blank')}
                                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-xs font-bold"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                View Document
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">{m.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {activeTab === 'outputs' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {!consultationId && !isReviewingReport ? (
                  <div className="text-center py-20 text-slate-500">
                    Reports will be generated once the consultation ends.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-700/50">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Doctor Notes</h4>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{editableNotes || "Generating..."}</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-700/50">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Prescription</h4>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{editablePrescription || "Generating..."}</p>
                    </div>
                    {user.role === 'doctor' && (
                      <button 
                        onClick={() => setIsReviewingReport(true)}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                      >
                        Edit & Send to Patient
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          {activeTab === 'chat' && (
            <div className="p-6 border-t border-slate-700/50 bg-slate-800/80">
              <form onSubmit={sendChatMessage} className="flex gap-3">
                <label className="p-4 bg-slate-700 text-slate-300 rounded-2xl hover:bg-slate-600 transition-all cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={uit.typeMessage} className="flex-1 bg-slate-700/50 text-white px-6 py-4 rounded-2xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
                <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
              </form>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-slate-800/80 backdrop-blur-xl border-t border-slate-700/50 p-6 flex items-center justify-center gap-8">
        <button onClick={() => setIsMuted(!isMuted)} className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-slate-700 text-white hover:bg-slate-600'}`}><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">{isMuted ? <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /> : <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />}</svg></button>
        <button onClick={() => setIsVideoOff(!isVideoOff)} className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-slate-700 text-white hover:bg-slate-600'}`}><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">{isVideoOff ? <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z M3 3l18 18" /> : <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />}</svg></button>

        <button onClick={() => setIsTranscriptionEnabled(!isTranscriptionEnabled)} className={`flex items-center gap-3 px-6 h-16 rounded-3xl transition-all ${isTranscriptionEnabled ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-700 text-slate-400'}`}>
          <div className={`w-3 h-3 rounded-full ${isTranscriptionEnabled ? 'bg-blue-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="font-bold text-sm tracking-wide uppercase">{uit.transcriptionEnabled}</span>
        </button>

        {isCallEnded ? (
          <div className="px-12 py-5 bg-slate-700 text-slate-400 rounded-3xl font-bold text-lg cursor-not-allowed border border-slate-600">
            Call Ended
          </div>
        ) : (
          !isCallActive ? (
            <button onClick={() => setShowPermissionModal(true)} className="px-12 py-5 bg-emerald-600 text-white rounded-3xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20">{uit.joinCall}</button>
          ) : (
            <button onClick={endCall} className="px-12 py-5 bg-red-600 text-white rounded-3xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">{uit.endCall}</button>
          )
        )}
      </footer>
    </div>
  );
}
