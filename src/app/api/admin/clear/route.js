import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";

const ALLOWED_COLLECTIONS = [
  "bacteriology_reports",
  "bacteriology_requests",
  "veterinary_cases",
  "diagnoses",
  "lab_requests",
  "parasitology_reports",
  "parasitology_requests",
  "pathology_reports",
  "pathology_requests",
  "pharmacy_records",
];

export async function POST(request) {
  try {
    const { target } = await request.json();

    if (!target) {
      return NextResponse.json(
        { error: "Missing 'target' field" },
        { status: 400 }
      );
    }

    if (!ALLOWED_COLLECTIONS.includes(target)) {
      return NextResponse.json(
        { error: `Collection "${target}" is not allowed.` },
        { status: 400 }
      );
    }

    const mongoose = await dbConnect();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("MongoDB connection not established");
    }

    // Check if collection exists
    const collections = await db.listCollections({ name: target }).toArray();
    if (collections.length === 0) {
      return NextResponse.json(
        { error: `Collection "${target}" does not exist.` },
        { status: 404 }
      );
    }

    const result = await db.collection(target).deleteMany({});
    return NextResponse.json({
      success: true,
      message: `Cleared ${result.deletedCount} documents from "${target}".`,
    });
  } catch (error) {
    console.error("Clear collection error:", error.message);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}