import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'case_registration',
        'pathology',
        'bacteriology',
        'parasitology',
        'diagnosis_petdoc',
        'diagnosis_largedoc',
        'diagnosis_equinedoc',
        'pharmacy',
      ],
    },
    pin: {
      type: String,
      required: true,
      default: '123456',
    },
    label: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, collection: 'credentials' }
);

const Credential =
  mongoose.models.Credential || mongoose.model('Credential', credentialSchema);

export default Credential;