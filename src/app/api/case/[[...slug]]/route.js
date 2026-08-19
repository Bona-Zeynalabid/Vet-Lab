import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import VeterinaryCase from '@/models/Case';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    const id = slug?.[0];

    if (id) {
      const doc = await VeterinaryCase.findById(id);
      if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(doc);
    }

    const { searchParams } = new URL(request.url);
    const filter = {};

    if (searchParams.has('caseNumber'))
      filter['caseInfo.caseNumber'] = searchParams.get('caseNumber');
    if (searchParams.has('species'))
      filter['patient.species'] = { $regex: searchParams.get('species'), $options: 'i' };
    if (searchParams.has('ownerName'))
      filter['owner.fullName'] = { $regex: searchParams.get('ownerName'), $options: 'i' };
    if (searchParams.has('lab'))
      filter.lab = searchParams.get('lab');
    if (searchParams.has('by'))
  filter.by = searchParams.get('by');

    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const docs = await VeterinaryCase.find(filter)
      .sort({ 'caseInfo.date': -1 })
      .skip(skip)
      .limit(limit);
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await dbConnect();
    if (params.slug?.[0]) {
      return NextResponse.json({ error: 'POST to collection only' }, { status: 400 });
    }

    const body = await request.json();
    if (!body.caseInfo?.caseNumber) {
      return NextResponse.json({ error: 'caseInfo.caseNumber required' }, { status: 400 });
    }

    const doc = await VeterinaryCase.create(body);
    return NextResponse.json(doc, { status: 201 });
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
    const updated = await VeterinaryCase.findByIdAndUpdate(id, body, {
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

    const deleted = await VeterinaryCase.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}