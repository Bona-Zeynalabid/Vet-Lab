import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Credential from '@/models/Credential';

const defaultCredentials = [
  {
    role: 'case_registration',
    pin: '111111',
    label: 'Case Registration',
    route: '/dashboard/case-registration',
  },
  {
    role: 'pathology',
    pin: '222222',
    label: 'Pathology Lab',
    route: '/dashboard/pathology',
  },
  {
    role: 'bacteriology',
    pin: '333333',
    label: 'Bacteriology Lab',
    route: '/dashboard/bacteriology',
  },
  {
    role: 'parasitology',
    pin: '444444',
    label: 'Parasitology Lab',
    route: '/dashboard/parasitology',
  },
  {
    role: 'diagnosis_petdoc',
    pin: '555555',
    label: 'Diagnosis - Pet Doctor',
    route: '/dashboard/diagnosis?doc=petdoc',
  },
  {
    role: 'diagnosis_largedoc',
    pin: '666666',
    label: 'Diagnosis - Large Animal Doctor',
    route: '/dashboard/diagnosis?doc=large%20doc',
  },
  {
    role: 'diagnosis_equinedoc',
    pin: '777777',
    label: 'Diagnosis - Equine Specialist',
    route: '/dashboard/diagnosis?doc=equine%20doc',
  },
  {
    role: 'pharmacy',
    pin: '888888',
    label: 'Pharmacy',
    route: '/dashboard/pharmacy',
  },
];

export async function GET() {
  try {
    await dbConnect();
    const existingCount = await Credential.countDocuments();
    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Credentials already seeded',
        count: existingCount,
      });
    }
    await Credential.insertMany(defaultCredentials);
    return NextResponse.json({
      message: 'Default credentials seeded with unique PINs',
      count: defaultCredentials.length,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}