import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Credential from '@/models/Credential';

export async function POST(request) {
  try {
    await dbConnect();
    const { role, pin } = await request.json();

    if (!role || !pin) {
      return NextResponse.json({ error: 'role and pin are required' }, { status: 400 });
    }

    const cred = await Credential.findOne({ role });

    if (!cred) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (cred.pin !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      role: cred.role,
      route: cred.route,
      label: cred.label,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}