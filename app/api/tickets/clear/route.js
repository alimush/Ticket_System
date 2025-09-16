import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Ticket from "@/models/Ticket";

export async function DELETE() {
  try {
    await dbConnect();
    const result = await Ticket.deleteMany({});
    return NextResponse.json(
      { message: `Deleted ${result.deletedCount} tickets` },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in DELETE /api/tickets/clear:", error);
    return NextResponse.json(
      { error: "Failed to delete tickets" },
      { status: 500 }
    );
  }
}