import dbConnect from "@/lib/mongodb";
import Ticket from "@/models/Ticket";

export async function GET() {
  try {
    await dbConnect();
    const tickets = await Ticket.find({}).sort({ createdAt: -1 });
    return new Response(JSON.stringify(tickets), { status: 200 });
  } catch (err) {
    console.error("❌ Error in GET /api/tickets:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const ticket = await Ticket.create(body);
    
    return new Response(JSON.stringify(ticket), { status: 201 });
  } catch (err) {
    console.error("❌ Error in POST /api/tickets:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
