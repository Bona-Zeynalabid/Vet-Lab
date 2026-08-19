import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(request) {
  try {
    await dbConnect();
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ error: 'Credential missing' }, { status: 400 });
    }

    // Verify Google token
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    const tokenInfo = await tokenInfoRes.json();

    if (tokenInfo.error) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const email = tokenInfo.email.toLowerCase();
    const googleId = tokenInfo.sub;

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return NextResponse.json({
        exists: false,
        googleData: { email, googleId },
      });
    }

    // User exists – set 7‑day cookie
    const cookieStore = await cookies();
    cookieStore.set(
      'vet_user',
      JSON.stringify({
        _id: existingUser._id,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        role: existingUser.role,
        student: existingUser.student,
        idNumber: existingUser.idNumber,
        blocked: existingUser.blocked,
      }),
      {
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      }
    );

    return NextResponse.json({
      exists: true,
      user: existingUser,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}