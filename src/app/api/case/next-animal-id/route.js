import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import AnimalCounter from "@/models/AnimalCounter";

const speciesCodeMap = {
  horse: "HOR", equine: "HOR", pony: "HOR",
  cat: "CAT", feline: "CAT", kitten: "CAT",
  dog: "DOG", canine: "DOG", puppy: "DOG",
  cattle: "COW", cow: "COW", bovine: "COW", calf: "COW",
  goat: "GOA", caprine: "GOA", kid: "GOA",
  sheep: "SHE", ovine: "SHE", lamb: "SHE",
  pig: "PIG", swine: "PIG", porcine: "PIG", piglet: "PIG",
  poultry: "POU", chicken: "POU", hen: "POU", rooster: "POU",
  camel: "CAM", dromedary: "CAM",
  donkey: "DON", mule: "DON",
  rabbit: "RAB", bunny: "RAB",
  other: "OTH",
};

function getSpeciesCode(species) {
  if (!species) return "OTH";
  const key = String(species).trim().toLowerCase();
  return speciesCodeMap[key] || "OTH";
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const species = searchParams.get("species") || "";

    const code = getSpeciesCode(species);

    // Atomically increment and return the new value
    const counter = await AnimalCounter.findOneAndUpdate(
      { _id: code },
      { $inc: { lastNumber: 1 } },
      { new: true, upsert: true }
    );

    const animalId = `${code}-${String(counter.lastNumber).padStart(3, "0")}`;

    return NextResponse.json({ animalId, speciesCode: code });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}