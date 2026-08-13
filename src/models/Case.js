import mongoose from 'mongoose';

const bloodLabSchema = new mongoose.Schema({
  tests: { type: [String], default: [] },
  notes: { type: String, default: '' },
}, { _id: false });

const urineLabSchema = new mongoose.Schema({
  tests: { type: [String], default: [] },
  notes: { type: String, default: '' },
}, { _id: false });

const fecesLabSchema = new mongoose.Schema({
  tests: { type: [String], default: [] },
  notes: { type: String, default: '' },
}, { _id: false });

const nasalLabSchema = new mongoose.Schema({
  tests: { type: [String], default: [] },
  notes: { type: String, default: '' },
}, { _id: false });

const rumenLabSchema = new mongoose.Schema({
  tests: { type: [String], default: [] },
  notes: { type: String, default: '' },
}, { _id: false });

const veterinaryCaseSchema = new mongoose.Schema({
  caseInfo: {
    date: { type: Date, required: true },
    caseNumber: { type: String, required: true, unique: true, trim: true },
  },
  owner: {
    fullName: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    telephone: { type: String, default: '' },
  },
  patient: {
    species: { type: String, required: true, trim: true },
    numberOfAnimals: { type: Number, min: 1, default: 1 },
    breed: { type: String, default: '' },
    animalId: { type: String, default: '' },
    sex: { type: String, enum: ['', 'male', 'female', 'neutered_male', 'spayed_female'], default: '' },
    age: { type: String, default: '' },
    weight: { type: Number, default: null },
  },
  lab: { type: String, required: true },
  doc: {
  type: String,
  default: '',
},
  anamnesis: {
    primaryComplaint: { type: String, default: '' },
    history: { type: String, default: '' },
  },
  physicalExam: {
    demeanor: { type: String, default: '' },
    bcs: { type: String, default: '' },
    mucousMembrane: { type: String, default: '' },
    respiratoryRate: { type: String, default: '' },
    crt: { type: String, default: '' },
    pulseRate: { type: String, default: '' },
    heartSound: { type: String, default: '' },
    giMotility: { type: String, default: '' },
    lungSound: { type: String, default: '' },
    temperature: { type: Number, default: null },
    otherFindings: { type: String, default: '' },
  },
  labDirectives: {
    blood: bloodLabSchema,
    urine: urineLabSchema,
    feces: fecesLabSchema,
    nasal: nasalLabSchema,
    rumen: rumenLabSchema,
  },
}, { timestamps: true, collection: 'veterinary_cases' });

veterinaryCaseSchema.index({ 'caseInfo.date': -1 });
veterinaryCaseSchema.index({ 'owner.fullName': 1 });

const Case = mongoose.models.Case || mongoose.model('Case', veterinaryCaseSchema);
export default Case;