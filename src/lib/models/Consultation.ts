import mongoose from "mongoose";

const ConsultationSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true },
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  transcript: { type: String, required: true },
  doctorNotes: { type: String, required: true },
  prescription: { type: String, required: true },
  patientSummary: { type: String, required: true },
  language: { type: String, required: true },
  lifestyleRecommendations: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Consultation || mongoose.model("Consultation", ConsultationSchema);
