import mongoose from 'mongoose';

const BacteriologySchema = new mongoose.Schema({
  caseId: { type: String, required: true, trim: true },
  doc: { type: String, required: true },
  dateReceived: { type: Date, default: Date.now },
  sample: {
    type: { type: String, enum: ['blood', 'urine', 'milk', 'feces', 'nasal_swab', 'pus', 'tissue', 'ear_swab', 'skin', 'csf', 'other'], required: true },
    collectionMethod: { type: String, default: '' },
    site: { type: String, default: '' },
  },
  cultureDetails: {
    mediaUsed: [{ type: String }],
    incubation: {
      temperature: { type: String, default: '37°C' },
      atmosphere: { type: String, enum: ['aerobic', 'anaerobic', 'microaerophilic', 'co2'], default: 'aerobic' },
      duration: { type: String, default: '24-72 hours' },
    },
    growthObservation: {
      hours24: { type: String, enum: ['no_growth', 'scanty', 'moderate', 'heavy'], default: 'no_growth' },
      hours48: { type: String, enum: ['no_growth', 'scanty', 'moderate', 'heavy'], default: 'no_growth' },
      hours72: { type: String, enum: ['no_growth', 'scanty', 'moderate', 'heavy'], default: 'no_growth' },
    },
  },
  colonyMorphology: {
    size: { type: String, default: '' },
    shape: { type: String, default: '' },
    color: { type: String, default: '' },
    opacity: { type: String, default: '' },
    elevation: { type: String, default: '' },
    margin: { type: String, default: '' },
    consistency: { type: String, default: '' },
    hemolysis: { type: String, enum: ['alpha', 'beta', 'gamma'], default: '' },
    odor: { type: String, default: '' },
  },
  gramStain: {
    gramReaction: { type: String, enum: ['gram_positive', 'gram_negative', 'gram_variable'], default: '' },
    bacterialMorphology: { type: String, default: '' },
    microscopicFindings: { type: String, default: '' },
  },
  biochemicalTests: {
    catalase: { type: String, default: '' },
    oxidase: { type: String, default: '' },
    coagulase: { type: String, default: '' },
    urease: { type: String, default: '' },
    indole: { type: String, default: '' },
    citrate: { type: String, default: '' },
    methylRed: { type: String, default: '' },
    vogesProskauer: { type: String, default: '' },
    tsi: { type: String, default: '' },
    motility: { type: String, default: '' },
  },
  organismIdentification: {
    organismName: { type: String, default: '' },
    confidenceLevel: { type: String, enum: ['definitive', 'presumptive', 'tentative'], default: 'tentative' },
  },
  antibioticSensitivity: {
    method: { type: String, enum: ['kirby_bauer', 'mic', 'e_test', 'vitek'], default: 'kirby_bauer' },
    results: [{
      antibiotic: String,
      zoneSize: String,
      interpretation: { type: String, enum: ['s', 'i', 'r'], default: 's' },
    }],
  },
  interpretation: { type: String, default: '' },
  bacteriologist: { type: String, default: '' },
  dateCompleted: { type: Date },
}, { timestamps: true, collection: 'bacteriology_reports' });

BacteriologySchema.index({ caseId: 1 });

const Bacteriology = mongoose.models.Bacteriology || mongoose.model('Bacteriology', BacteriologySchema);
export default Bacteriology;