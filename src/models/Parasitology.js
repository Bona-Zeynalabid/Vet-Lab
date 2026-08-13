import mongoose from 'mongoose';

const ParasitologySchema = new mongoose.Schema({
  caseId: { type: String, required: true, trim: true },
  doc: { type: String, required: true },
  dateReceived: { type: Date, default: Date.now },
  sample: {
    type: { type: String, enum: ['feces', 'blood_smear', 'skin_scraping', 'hair_pluck', 'ear_swab', 'tissue', 'urine', 'other'], required: true },
    collectionMethod: { type: String, default: '' },
    condition: { type: String, enum: ['fresh', 'refrigerated', 'preserved', 'old'], default: 'fresh' },
  },
  fecalExamination: {
    methodsPerformed: [{ type: String }],
    consistency: { type: String, enum: ['formed', 'soft', 'pasty', 'watery', 'mucoid', 'bloody'], default: 'formed' },
    parasitesFound: [{
      parasiteName: String,
      stageFound: { type: String, enum: ['ova', 'larvae', 'cysts', 'oocysts', 'trophozoites', 'adult', 'proglottids'], default: 'ova' },
      quantity: String,
      severity: { type: String, enum: ['rare', 'few', 'moderate', 'many'], default: 'few' },
    }],
  },
  bloodParasiteExamination: {
    stainingMethod: { type: String, enum: ['giemsa', 'wright', 'diff_quick', 'leishman'], default: 'giemsa' },
    smearType: { type: String, enum: ['thin_smear', 'thick_smear', 'buffy_coat'], default: 'thin_smear' },
    parasitesFound: [{
      parasiteName: String,
      detected: { type: String, enum: ['not_detected', 'detected'], default: 'not_detected' },
      parasitemiaLevel: String,
      stage: String,
    }],
  },
  ectoparasiteExamination: {
    examinationMethod: { type: String, enum: ['gross_visual', 'microscopic', 'tape', 'hair_pluck', 'ear_swab', 'comb'], default: 'microscopic' },
    siteExamined: { type: String, default: '' },
    parasitesFound: [{
      parasiteName: String,
      detected: { type: String, enum: ['not_detected', 'detected'], default: 'not_detected' },
      lifeStage: { type: String, enum: ['eggs', 'larvae', 'nymphs', 'adults', 'mixed'], default: 'adults' },
      quantity: { type: String, enum: ['rare', 'few', 'moderate', 'heavy'], default: 'few' },
    }],
  },
  interpretation: { type: String, default: '' },
  parasitologist: { type: String, default: '' },
  dateCompleted: { type: Date },
}, { timestamps: true, collection: 'parasitology_reports' });

ParasitologySchema.index({ caseId: 1 });

const Parasitology = mongoose.models.Parasitology || mongoose.model('Parasitology', ParasitologySchema);
export default Parasitology;