import mongoose from 'mongoose';

const labTestSchema = new mongoose.Schema({
  tests: [String],
  notes: { type: String, default: '' }
}, { _id: false });

const labRequestSchema = new mongoose.Schema({
  caseId: { type: String, required: true, trim: true },
  lab: { type: String, required: true, enum: ['pathology', 'bacteriology', 'parasitology'] },
  doc: { type: String, required: true },
  dateRequested: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  labDirectives: {
    blood: labTestSchema,
    urine: labTestSchema,
    feces: labTestSchema,
    nasal: labTestSchema,
    rumen: labTestSchema,
  },
}, { timestamps: true, collection: 'lab_requests' });

labRequestSchema.index({ lab: 1, status: 1 });
labRequestSchema.index({ caseId: 1 });

const LabRequest = mongoose.models.LabRequest || mongoose.model('LabRequest', labRequestSchema);
export default LabRequest;