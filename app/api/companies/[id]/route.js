import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Company from "@/models/Company";

export async function PATCH(req, context) {
  try {
    await dbConnect();

    const { id } = context.params;
    const { name } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const cleanName = name.trim();

    const exists = await Company.findOne({
      name: cleanName,
      _id: { $ne: id },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Company already exists" },
        { status: 400 }
      );
    }

    const updated = await Company.findByIdAndUpdate(
      id,
      { name: cleanName },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("❌ Error updating company:", err);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    await dbConnect();

    const { id } = context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }

    const deleted = await Company.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Company deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error deleting company:", err);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}