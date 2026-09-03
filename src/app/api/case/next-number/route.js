import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CaseCounter from '@/models/CaseCounter';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const increment = searchParams.get('increment') === 'true';

    let counter;
    if (increment) {
      // Atomically increment and return the new value
      counter = await CaseCounter.findOneAndUpdate(
        { _id: 'case_number' },
        { $inc: { lastNumber: 1 } },
        { new: true, upsert: true }
      );
    } else {
      // Just read the current value without incrementing
      counter = await CaseCounter.findById('case_number');
      if (!counter) {
        counter = await CaseCounter.create({ _id: 'case_number', lastNumber: 0 });
      }
    }

    const nextNumber = counter.lastNumber + 1;
    const caseNumber = String(nextNumber).padStart(2, '0');

    return NextResponse.json({ caseNumber });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}