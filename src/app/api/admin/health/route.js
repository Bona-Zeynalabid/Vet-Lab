import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const response = {
    mongodb: { status: "error", usedSpace: "N/A", totalSpace: "N/A", collections: 0, documents: 0 },
    supabase: { status: "error", usedSpace: "N/A", totalSpace: "N/A", tables: 0, rows: 0 },
    api: { status: "healthy", uptime: process.uptime(), lastPing: new Date().toISOString() },
  };

  // ---------- MongoDB ----------
  try {
    const mongoose = await dbConnect();
    const db = mongoose.connection.db; // native MongoDB database object

    if (!db) {
      throw new Error("MongoDB connection not established");
    }

    const stats = await db.stats();
    const collections = await db.listCollections().toArray();

    response.mongodb = {
      status: "healthy",
      usedSpace: `${(stats.storageSize / 1024 / 1024 / 1024).toFixed(2)} GB`,
      totalSpace: `${(stats.totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`,
      collections: collections.length,
      documents: stats.objects,
    };
  } catch (error) {
    console.error("MongoDB health error:", error.message);
    response.mongodb.status = "error";
    response.mongodb.error = error.message;
  }

  // ---------- Supabase ----------
  try {
    const tableNames = ["users", "completed_cases", "cases", "diagnoses"];
    let totalRows = 0;
    let tablesFound = 0;

    for (const table of tableNames) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        if (!error && count !== null) {
          totalRows += count;
          tablesFound++;
        }
      } catch (e) {
        // ignore per-table errors
      }
    }

    response.supabase = {
      status: tablesFound > 0 ? "healthy" : "warning",
      usedSpace: "N/A",
      totalSpace: "N/A",
      tables: tablesFound,
      rows: totalRows,
    };
  } catch (error) {
    console.error("Supabase health error:", error.message);
    response.supabase.status = "error";
    response.supabase.error = error.message;
  }

  return NextResponse.json(response);
}