import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Case from '@/models/Case';
import CaseCounter from '@/models/CaseCounter';

export async function GET() {
  try {
    await dbConnect();

    const cases = await Case.find({}, 'caseInfo.caseNumber').lean();
    let maxNum = 0;
    for (const c of cases) {
      const num = parseInt(c.caseInfo?.caseNumber, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }

    await CaseCounter.findOneAndUpdate(
      { _id: 'case_number' },
      { $set: { lastNumber: maxNum } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: 'Counter seeded', lastNumber: maxNum });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}