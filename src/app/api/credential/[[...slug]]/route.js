import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Credential from '@/models/Credential';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    const id = slug?.[0];

    if (id) {
      const cred = await Credential.findById(id);
      if (!cred) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(cred);
    }

    const { searchParams } = new URL(request.url);
    const filter = {};
    if (searchParams.has('role')) filter.role = searchParams.get('role');

    const docs = await Credential.find(filter).sort({ role: 1 });
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    if (slug?.[0]) return NextResponse.json({ error: 'POST to collection only' }, { status: 400 });

    const body = await request.json();
    if (!body.role || !body.pin || !body.label || !body.route) {
      return NextResponse.json({ error: 'role, pin, label, route are required' }, { status: 400 });
    }

    const cred = await Credential.create(body);
    return NextResponse.json(cred, { status: 201 });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    const id = slug?.[0];
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const body = await request.json();
    const updated = await Credential.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    const id = slug?.[0];
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const deleted = await Credential.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}