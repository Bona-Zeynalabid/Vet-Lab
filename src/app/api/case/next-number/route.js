import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CaseCounter from '@/models/CaseCounter';

export async function GET() {
  try {
    await dbConnect();

    // Atomically increment the counter and return the updated value
    const counter = await CaseCounter.findOneAndUpdate(
      { _id: 'case_number' },
      { $inc: { lastNumber: 1 } },
      { new: true, upsert: true }
    );

    const caseNumber = String(counter.lastNumber).padStart(2, '0');

    return NextResponse.json({ caseNumber });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}