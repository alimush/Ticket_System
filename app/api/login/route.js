import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    await dbConnect();
    const { username, password } = await req.json();

    const user = await User.findOne({ username });

    if (!user) {
      return new Response(JSON.stringify({ error: "❌ User not found" }), {
        status: 400,
      });
    }

    if (user.password !== password) {
      return new Response(JSON.stringify({ error: "❌ Wrong password" }), {
        status: 401,
      });
    }

    return new Response(
      JSON.stringify({
        message: "✅ Login successful",
        user: {
          username: user.username,
          role: user.role || "user", // 🟢 رجع الدور
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "⚠️ Server error", details: err.message }),
      { status: 500 }
    );
  }
}