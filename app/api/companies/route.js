import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Company from "@/models/Company";

export async function GET() {
  try {
    await dbConnect();
    const companies = await Company.find({}).sort({ name: 1 });
    return NextResponse.json(companies, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching companies:", err);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const exists = await Company.findOne({ name });
    if (exists) {
      return NextResponse.json({ error: "Company already exists" }, { status: 400 });
    }

    const company = await Company.create({ name });
    return NextResponse.json(company, { status: 201 });
  } catch (err) {
    console.error("❌ Error creating company:", err);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}