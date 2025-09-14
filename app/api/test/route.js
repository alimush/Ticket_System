import dbConnect from "@/lib/mongodb";

export async function GET() {
  try {
    await dbConnect();
    return new Response(
      JSON.stringify({ status: "success", message: "✅ MongoDB is connected!" }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: "❌ MongoDB connection failed", error: error.message }),
      { status: 500 }
    );
  }
}
