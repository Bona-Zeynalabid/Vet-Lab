import mongoose from "mongoose";

const animalCounterSchema = new mongoose.Schema(
  {
    _id: { type: String }, // e.g. "HOR", "CAT", "DOG"
    lastNumber: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "animal_counters" }
);

const AnimalCounter =
  mongoose.models.AnimalCounter ||
  mongoose.model("AnimalCounter", animalCounterSchema);

export default AnimalCounter;