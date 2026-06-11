import { createClient } from "@supabase/supabase-js";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log state of keys for debugging
  console.log("Supabase URL present:", !!supabaseUrl);
  console.log("Supabase Service Role Key present:", !!supabaseServiceRoleKey);

  // API routes FIRST
  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized: Missing Authorization header" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Unauthorized: Missing Bearer token" });
      }

      if (!supabaseUrl) {
        return res.status(500).json({ error: "Server Configuration Error: Supabase URL is missing on the server." });
      }

      if (!supabaseServiceRoleKey) {
        return res.status(500).json({ error: "Server Configuration Error: SUPABASE_SERVICE_ROLE_KEY is missing on the server. Please set this in your environment/secrets." });
      }

      // Initialize admin client with service_role key to bypass RLS and use auth.admin APIs
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
        return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
      }

      // Query the requester's profile role from the profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Failed to query profile:", profileError);
        return res.status(403).json({ error: "Forbidden: Requester profile not found or database error" });
      }

      // Authorization Check: Only administrators are authorized to reset passwords
      if (profile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Only administrators can perform password resets" });
      }

      // Extract target options
      const { userId, newPassword } = req.body;
      if (!userId || !newPassword) {
        return res.status(400).json({ error: "Bad Request: Missing userId or newPassword in request body" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Bad Request: Password must be at least 6 characters" });
      }

      // Perform admin password reset
      const { data: updatedUserData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        console.error("Supabase Admin password update failed:", updateError);
        return res.status(500).json({ error: `Reset Failed: ${updateError.message}` });
      }

      console.log(`Password successfully reset for user ${userId} by admin ${user.id}`);
      return res.json({ success: true, message: "User password updated successfully" });
    } catch (err: any) {
      console.error("Unexpected error in reset-password endpoint:", err);
      return res.status(500).json({ error: `Internal Server Error: ${err.message || err}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
