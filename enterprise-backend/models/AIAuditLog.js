const mongoose = require('mongoose');

const AIAuditLogSchema = new mongoose.Schema({
  physicianId: { type: String, required: true },
  patientIdHash: { type: String, required: true }, // Storing hash instead of ID for HIPAA/GDPR privacy
  generatedDiagnosis: { type: String, required: true },
  icd10Codes: [{ type: String }],
  timestamp: { type: Date, default: Date.now },
  aiModelVersion: { type: String, default: "gemini-1.5-pro" }
});

module.exports = mongoose.model('AIAuditLog', AIAuditLogSchema);