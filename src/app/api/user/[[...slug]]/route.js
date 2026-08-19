import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    const id = slug?.[0];

    if (id) {
      const user = await User.findById(id);
      if (!user)
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json(user);
    }

    const { searchParams } = new URL(request.url);
    const filter = {};
    if (searchParams.has("email"))
      filter.email = searchParams.get("email").toLowerCase();
    if (searchParams.has("role")) filter.role = searchParams.get("role");
    if (searchParams.has("student"))
      filter.student = searchParams.get("student") === "true";

    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = parseInt(searchParams.get("skip") || "0");

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { firstName, lastName, idNumber, student, email, googleId, role } =
      body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "firstName, lastName, email are required" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      student: student || false,
      blocked: false,
      googleId: googleId || null,
      role: role || "ordinary",
    };

    if (userData.student) {
      if (!idNumber) {
        return NextResponse.json(
          { error: "ID number is required for students" },
          { status: 400 }
        );
      }
      userData.idNumber = idNumber;
    }

    const newUser = await User.create(userData);

    // Set cookie for auto-login
    const cookieStore = await cookies();
    cookieStore.set(
      "vet_user",
      JSON.stringify({
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        student: newUser.student,
        idNumber: newUser.idNumber,
        blocked: newUser.blocked,
      }),
      {
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
        httpOnly: false,
        sameSite: "lax",
      }
    );

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error.name === "ValidationError") {
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
    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await request.json();
    const updated = await User.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    if (error.name === "ValidationError") {
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
    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}