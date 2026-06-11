import { createClient } from "@supabase/supabase-js";

export async function handler(event: any, context: any) {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Unauthorized: Missing Authorization header" }),
      };
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Unauthorized: Missing Bearer token" }),
      };
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Server Configuration Error: Supabase URL is missing on the server." }),
      };
    }

    if (!supabaseServiceRoleKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Server Configuration Error: SUPABASE_SERVICE_ROLE_KEY is missing on the server. Please set this in your environment/secrets." }),
      };
    }

    // Initialize admin client with service_role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Verify the requester's token via Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth verification failed:", authError);
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
      };
    }

    // Query profile role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Failed to query profile:", profileError);
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Forbidden: Requester profile not found or database error" }),
      };
    }

    // Check admin authorized
    if (profile.role !== "admin") {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Forbidden: Only administrators can perform password resets" }),
      };
    }

    // Parse body
    const body = JSON.parse(event.body || "{}");
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Bad Request: Missing userId or newPassword in request body" }),
      };
    }

    if (newPassword.length < 6) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Bad Request: Password must be at least 6 characters" }),
      };
    }

    // Perform admin password reset
    const { data: updatedUserData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Supabase Admin password update failed:", updateError);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `Reset Failed: ${updateError.message}` }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true, message: "User password updated successfully" }),
    };
  } catch (err: any) {
    console.error("Unexpected error in Netlify function reset-password:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: `Internal Server Error: ${err.message || err}` }),
    };
  }
}
