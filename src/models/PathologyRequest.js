import mongoose from 'mongoose';

const PathologyRequestSchema = new mongoose.Schema({
  caseId: { type: String, required: true, trim: true },
  doc: { type: String, required: true },
  dateRequested: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },

  // Same as Pathology
  milkExamination: {
    cmt: {
      rightFront: { type: String, enum: ['negative', 'trace', '1', '2', '3'], default: 'negative' },
      rightHind: { type: String, enum: ['negative', 'trace', '1', '2', '3'], default: 'negative' },
      leftFront: { type: String, enum: ['negative', 'trace', '1', '2', '3'], default: 'negative' },
      leftHind: { type: String, enum: ['negative', 'trace', '1', '2', '3'], default: 'negative' },
    },
    somaticCellCount: { type: String, default: '' },
    electricalConductivity: { type: Number, default: null },
    milkPh: { type: Number, default: null },
    bacterialCulture: { type: String, default: '' },
    antibioticResidue: { type: String, enum: ['negative', 'positive'], default: 'negative' },
    appearance: { type: String, default: '' },
  },
  semenAnalysis: {
    volume: { type: Number, default: null },
    color: { type: String, default: '' },
    consistency: { type: String, default: '' },
    ph: { type: Number, default: null },
    massMotility: { type: String, enum: ['0', '1', '2', '3', '4'], default: '0' },
    individualMotility: { type: Number, default: null },
    individualMotilityGrade: { type: String, enum: ['a', 'b', 'c', 'd'], default: 'a' },
    morphology: {
      normalPercentage: { type: Number, default: null },
      abnormalities: {
        bentTail: { type: Number, default: 0 },
        coiledTail: { type: Number, default: 0 },
        detachedHead: { type: Number, default: 0 },
        proximalDroplet: { type: Number, default: 0 },
        distalDroplet: { type: Number, default: 0 },
        acrosomeDefect: { type: Number, default: 0 },
        midpieceDefect: { type: Number, default: 0 },
        doubleHead: { type: Number, default: 0 },
      },
    },
    catalaseTest: { type: String, enum: ['negative', 'positive_1', 'positive_2', 'positive_3'], default: 'negative' },
    vesicularNeurosis: { type: String, enum: ['absent', 'mild', 'moderate', 'severe'], default: 'absent' },
    liveDeadRatio: { type: String, default: '' },
    spermConcentration: { type: Number, default: null },
  },
  urinalysis: {
    appearance: { type: String, default: '' },
    color: { type: String, default: '' },
    specificGravity: { type: Number, default: null },
    ph: { type: Number, default: null },
    protein: { type: String, default: '' },
    glucose: { type: String, default: '' },
    ketones: { type: String, default: '' },
    blood: { type: String, default: '' },
    bilirubin: { type: String, default: '' },
    microscopicFindings: { type: String, default: '' },
  },
  hematology: {
    erythrocytes: {
      rbcCount: { type: Number, default: null },
      haemoglobin: { type: Number, default: null },
      haematocrit: { type: Number, default: null },
      mcv: { type: Number, default: null },
      mch: { type: Number, default: null },
      mchc: { type: Number, default: null },
    },
    leukocytes: {
      plateletCount: { type: Number, default: null },
      wbcCount: { type: Number, default: null },
      neutrophils: { type: Number, default: null },
      bandNeutrophils: { type: Number, default: null },
      lymphocytes: { type: Number, default: null },
      monocytes: { type: Number, default: null },
      eosinophils: { type: Number, default: null },
      basophils: { type: Number, default: null },
    },
    plasmaProteins: {
      fibrinogen: { type: Number, default: null },
      plasmaProtein: { type: Number, default: null },
      fibrinogenRatio: { type: Number, default: null },
    },
  },
  technician: { type: String, default: '' },
  dateCompleted: { type: Date },
}, { timestamps: true, collection: 'pathology_requests' });

PathologyRequestSchema.index({ caseId: 1, status: 1 });

const PathologyRequest = mongoose.models.PathologyRequest || mongoose.model('PathologyRequest', PathologyRequestSchema);
export default PathologyRequest;