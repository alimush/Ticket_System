import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Ticket from "@/models/Ticket";

// 🟢 Get one ticket by ID
export async function GET(req, context) {
  try {
    await dbConnect();

    const { id } = context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket, { status: 200 });
  } catch (error) {
    console.error("❌ Error in GET /api/tickets/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// 🟡 Update (PATCH)
export async function PATCH(req, context) {
  try {
    await dbConnect();

    const { id } = context.params;
    const body = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    // 🟢 إذا تغيرت الحالة إلى done نحفظ وقتها
    if (body.status === "done" && !body.doneAt) {
      body.doneAt = new Date();
    }

    const updated = await Ticket.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("❌ Error in PATCH /api/tickets/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update ticket" },
      { status: 500 }
    );
  }
}

// 🔴 Delete
export async function DELETE(req, context) {
  try {
    await dbConnect();

    const { id } = context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    const deleted = await Ticket.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Ticket deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in DELETE /api/tickets/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete ticket" },
      { status: 500 }
    );
  }
}