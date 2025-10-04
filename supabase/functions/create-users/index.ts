import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UserAccount {
  email: string;
  password: string;
  role: string;
  dbId?: number;
  adminRole?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { accounts }: { accounts: UserAccount[] } = await req.json();

    const results = [];
    const errors = [];

    for (const account of accounts) {
      try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
        });

        if (authError) {
          errors.push({ email: account.email, error: authError.message });
          continue;
        }

        // Link to agent or admin table
        if (account.role === "agent" && account.dbId) {
          const { error: updateError } = await supabaseAdmin
            .from("agents")
            .update({ auth_user_id: authData.user?.id })
            .eq("id", account.dbId);

          if (updateError) {
            errors.push({ email: account.email, error: `Auth created but link failed: ${updateError.message}` });
          } else {
            results.push({ email: account.email, role: account.role, status: "success" });
          }
        } else if (account.role === "admin" && account.adminRole) {
          const { error: updateError } = await supabaseAdmin
            .from("admins")
            .update({ auth_user_id: authData.user?.id })
            .eq("email", account.email);

          if (updateError) {
            errors.push({ email: account.email, error: `Auth created but link failed: ${updateError.message}` });
          } else {
            results.push({ email: account.email, role: account.role, adminRole: account.adminRole, status: "success" });
          }
        }
      } catch (error) {
        errors.push({ email: account.email, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: results.length,
        failed: errors.length,
        results,
        errors,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
