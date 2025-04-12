import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { handleNewUserRegistration } from "@/app/actions/auth";
import type { Database } from "@/lib/supabase/database.types";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // Get cookie store properly for async usage
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore
    });

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    // Process any pending invitations for new users
    if (data?.session?.user) {
      const userId = data.session.user.id;
      const email = data.session.user.email;

      if (userId && email) {
        // Check if this is a new user (no existing groups)
        const { count, error: countError } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        // If user has no groups yet, they might be a new user
        if (!countError && count === 0) {
          console.log("Processing invited user registration:", email);
          await handleNewUserRegistration(userId, email);
        }
      }
    }
  }

  // Redirect to the dashboard
  return NextResponse.redirect(requestUrl.origin);
}
