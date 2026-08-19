import mongoose from 'mongoose';

const PharmacySchema = new mongoose.Schema({
  caseId: { type: String, required: true, trim: true },
  prescriptionDate: { type: Date, default: Date.now },
  prescriptionNumber: { type: String,  sparse: true },
  veterinarian: { type: String, default: '' },
  medicine: {
    name: { type: String, required: true },
    concentration: { type: String, default: '' },
    dosage: { type: String, default: '' },
    route: { type: String, enum: ['oral', 'subcutaneous', 'intramuscular', 'intravenous', 'topical'], default: 'oral' },
    frequency: { type: String, enum: ['once', 'bid', 'tid', 'qid', 'once_daily', 'every_12h'], default: 'once_daily' },
    duration: { type: String, default: '' },
    instructions: { type: String, default: '' },
    amount: { type: String, default: '' },
  },
  batchNumber: { type: String, default: '' },
  expiryDate: { type: Date },
  dispensedBy: { type: String, default: '' },
  dispensedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'dispensed', 'cancelled'], default: 'pending' },
}, { timestamps: true, collection: 'pharmacy_records' });

PharmacySchema.index({ caseId: 1 });
PharmacySchema.index({ prescriptionNumber: 1 }, { unique: true, sparse: true });

const Pharmacy = mongoose.models.Pharmacy || mongoose.model('Pharmacy', PharmacySchema);
export default Pharmacy;