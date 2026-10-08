import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Medicine from '@/models/Medicine';

// ---------- Helpers: translate between frontend & DB ----------
// Frontend sends "price" but the model stores "pricePerUnit".
function toDbShape(input) {
  const out = { ...input };
  if ('price' in out) {
    out.pricePerUnit = Number(out.price) || 0;
    delete out.price;
  }
  if ('pricePerUnit' in out && !('price' in input)) {
    out.pricePerUnit = Number(out.pricePerUnit) || 0;
  }
  if ('pricePerMlMg' in out) {
    out.pricePerMlMg = Number(out.pricePerMlMg) || 0;
  }
  if ('stockQuantity' in out) {
    out.stockQuantity = Number(out.stockQuantity) || 0;
  }
  return out;
}

// Add a "price" alias on the way out so the frontend sees what it expects.
function toClientShape(doc) {
  if (!doc) return doc;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  obj.price = obj.pricePerUnit ?? 0;
  return obj;
}

// ---------- GET ----------
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
      return NextResponse.json(toClientShape(medicine));
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

    return NextResponse.json(medicines.map(toClientShape));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ---------- POST ----------
export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    if (slug?.[0]) {
      return NextResponse.json({ error: 'POST to collection only' }, { status: 400 });
    }

    const rawBody = await request.json();
    if (!rawBody.name) {
      return NextResponse.json({ error: 'Medicine name is required' }, { status: 400 });
    }

    const existing = await Medicine.findOne({ name: rawBody.name.trim() });
    if (existing) {
      return NextResponse.json({ error: 'Medicine with this name already exists' }, { status: 409 });
    }

    const dbBody = toDbShape(rawBody);
    const medicine = await Medicine.create(dbBody);
    return NextResponse.json(toClientShape(medicine), { status: 201 });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ---------- PUT ----------
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    const id = slug?.[0];

    console.log("[PUT] id =", id);

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const rawBody = await request.json();
    console.log("[PUT] raw body =", JSON.stringify(rawBody));

    // Strip immutable fields
    delete rawBody._id;
    delete rawBody.__v;
    delete rawBody.createdAt;
    delete rawBody.updatedAt;
    delete rawBody.id;

    // ✅ Translate "price" → "pricePerUnit"
    const dbBody = toDbShape(rawBody);
    console.log("[PUT] db body =", JSON.stringify(dbBody));

    const existing = await Medicine.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    console.log("[PUT] BEFORE: pricePerUnit =", existing.pricePerUnit, "| pricePerMlMg =", existing.pricePerMlMg);

    // Assign only fields present in dbBody
    Object.keys(dbBody).forEach((key) => {
      existing[key] = dbBody[key];
    });

    const saved = await existing.save();

    console.log("[PUT] AFTER:  pricePerUnit =", saved.pricePerUnit, "| pricePerMlMg =", saved.pricePerMlMg);

    return NextResponse.json(toClientShape(saved));
  } catch (error) {
    console.error("[PUT] ERROR:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ---------- DELETE ----------
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