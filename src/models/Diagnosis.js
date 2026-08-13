import mongoose from 'mongoose';

const DiagnosisSchema = new mongoose.Schema({
  caseId: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },
  veterinarian: {
    name: { type: String, required: true },
    licenseNumber: { type: String, default: '' },
  },
  tentativeDiagnosis: {
    primary: { type: String, default: '' },
    differentials: [{ type: String }],
    clinicalJustification: { type: String, default: '' },
  },
  definitiveDiagnosis: {
    finalDiagnosis: { type: String, default: '' },
    confirmedBy: [{ type: String }],
    diagnosticNotes: { type: String, default: '' },
  },
  prognosis: { type: String, enum: ['excellent', 'good', 'fair', 'guarded', 'poor', 'grave'], default: 'fair' },
  followUp: {
    date: { type: Date },
    instructions: { type: String, default: '' },
  },
  status: { type: String, enum: ['draft', 'finalized', 'amended'], default: 'draft' },
}, { timestamps: true, collection: 'diagnoses' });

DiagnosisSchema.index({ caseId: 1 });

const Diagnosis = mongoose.models.Diagnosis || mongoose.model('Diagnosis', DiagnosisSchema);
export default Diagnosis;