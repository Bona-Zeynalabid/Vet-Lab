import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      unique: true,
    },

    // General price (default 0 ETB)
    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    // If liquid form, price per ml or mg
    isLiquid: {
      type: Boolean,
      default: false,
    },

    // For liquid: price per ml/mg
    pricePerMlMg: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional price per unit for solids (e.g., per tablet, capsule)
    pricePerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Dosage form: tablet, capsule, syrup, injection, etc.
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

    // Unit for measuring (e.g., tablet, bottle, ml, mg, g, etc.)
    unit: {
      type: String,
      default: '',
      trim: true,
    },

    // Active ingredient (optional)
    activeIngredient: {
      type: String,
      default: '',
      trim: true,
    },

    // Manufacturer or supplier
    manufacturer: {
      type: String,
      default: '',
      trim: true,
    },

    // Stock quantity
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional expiry date
    expiryDate: {
      type: Date,
      default: null,
    },

    // Optional batch number
    batchNumber: {
      type: String,
      default: '',
      trim: true,
    },

    // Currency is always ETB (Ethiopian Birr)
    // No need for a currency field; all prices are in ETB.
  },
  {
    timestamps: true,
    collection: 'medicines',
  }
);

// Index for quick search by name
medicineSchema.index({ name: 1 });

const Medicine =
  mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);

export default Medicine;