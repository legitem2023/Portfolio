// app/api/protected/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Facebook and Google are already inside this

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // The httpOnly cookie is automatically included in the request
  // You can access user data from the session
  return Response.json({ 
    message: "Protected data", 
    user: session.serverToken 
  });
}
