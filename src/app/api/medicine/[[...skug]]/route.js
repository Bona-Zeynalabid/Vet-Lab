import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Medicine from '@/models/Medicine';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    const id = slug?.[0];

    if (id) {
      const medicine = await Medicine.findById(id);
      if (!medicine) {
        return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
      }
      return NextResponse.json(medicine);
    }

    const { searchParams } = new URL(request.url);
    const filter = {};

    if (searchParams.has('name')) {
      filter.name = { $regex: searchParams.get('name'), $options: 'i' };
    }
    if (searchParams.has('dosageForm')) {
      filter.dosageForm = searchParams.get('dosageForm');
    }
    if (searchParams.has('isLiquid')) {
      filter.isLiquid = searchParams.get('isLiquid') === 'true';
    }

    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const medicines = await Medicine.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json(medicines);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    if (slug?.[0]) {
      return NextResponse.json({ error: 'POST to collection only' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Medicine name is required' }, { status: 400 });
    }

    const existing = await Medicine.findOne({ name: body.name.trim() });
    if (existing) {
      return NextResponse.json({ error: 'Medicine with this name already exists' }, { status: 409 });
    }

    const medicine = await Medicine.create(body);
    return NextResponse.json(medicine, { status: 201 });
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
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await Medicine.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }
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
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const deleted = await Medicine.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}