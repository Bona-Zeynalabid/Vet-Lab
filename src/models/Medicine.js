import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      unique: true,
    },

    // Flag: liquid vs solid
    isLiquid: {
      type: Boolean,
      default: false,
    },

    // Price per unit for solids (tablets, capsules, etc.)
    pricePerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Price per ml/mg for liquids
    pricePerMlMg: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Dosage form (for display)
    dosageForm: {
      type: String,
      enum: [
        'tablet',
        'capsule',
        'syrup',
        'injection',
        'ointment',
        'cream',
        'drops',
        'suspension',
        'inhaler',
        'other',
      ],
      default: 'other',
    },

    // Recommended dose rate (optional)
    doseRate: {
      type: String,
      default: '',
      trim: true,
      description: 'e.g. "10 mg/kg", "1 tablet/10kg"',
    },

    // Concentration / strength (optional)
    concentration: {
      type: String,
      default: '',
      trim: true,
      description: 'e.g. "250 mg/mL", "500 mg"',
    },

    // Stock quantity
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'medicines',
  }
);

// Indexes
medicineSchema.index({ name: 1 });

const Medicine =
  mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);

export default Medicine;