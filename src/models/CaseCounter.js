import mongoose from 'mongoose';

const caseCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: 'case_number',
    },
    lastNumber: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: 'case_counters' }
);

const CaseCounter =
  mongoose.models.CaseCounter ||
  mongoose.model('CaseCounter', caseCounterSchema);

export default CaseCounter;