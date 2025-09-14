// app/api/users/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// 🟢 Get Users (with optional search)
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    const filter = q ? { username: { $regex: q, $options: "i" } } : {};
    const users = await User.find(filter).sort({ createdAt: -1 });

    // رجّعهم داخل object مو Array مباشر
    return NextResponse.json({ users }, { status: 200 });
  } catch (e) {
    console.error("❌ GET /api/users:", e);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// ➕ Create User
export async function POST(req) {
  try {
    await dbConnect();
    const { username, password, role } = await req.json();

    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // role افتراضي user لو ما تحدد
    const user = await User.create({
      username,
      password,
      role: role || "user",
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    console.error("❌ POST /api/users:", e);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// ✏️ Update User
export async function PUT(req) {
  try {
    await dbConnect();
    const { id, username, password, role } = await req.json();

    const update = {};
    if (username !== undefined) update.username = username;
    if (password !== undefined) update.password = password;
    if (role !== undefined) update.role = role;

    const updated = await User.findByIdAndUpdate(id, update, { new: true });

    if (!updated) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (e) {
    console.error("❌ PUT /api/users:", e);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// 🗑 Delete User
export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (e) {
    console.error("❌ DELETE /api/users:", e);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
