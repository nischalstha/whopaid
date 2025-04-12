"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/database.types";

// Helper function to get Supabase client with proper cookie handling
async function getSupabaseClient() {
  const cookieStore = cookies();
  return createServerActionClient<Database>({ cookies: () => cookieStore });
}

export async function handleNewUserRegistration(userId: string, email: string) {
  // Initialize Supabase client with proper async handling
  const supabase = await getSupabaseClient();

  try {
    // Find all pending invitations for this email
    const { data: invitations, error: inviteError } = await supabase
      .from("invited_users")
      .select("*")
      .eq("email", email)
      .eq("status", "pending");

    if (inviteError) {
      console.error("Error finding invitations:", inviteError);
      return { error: inviteError.message };
    }

    if (!invitations || invitations.length === 0) {
      console.log(`No pending invitations found for ${email}`);
      return { success: true, message: "No pending invitations found" };
    }

    console.log(`Found ${invitations.length} pending invitations for ${email}`);

    // Create proper group memberships
    const groupMemberships = invitations.map(invite => ({
      group_id: invite.group_id,
      user_id: userId,
      is_admin: false
    }));

    // Add to group_members
    const { error: memberError } = await supabase
      .from("group_members")
      .insert(groupMemberships);

    if (memberError) {
      console.error("Error adding to groups:", memberError);
      return { error: memberError.message };
    }

    // Update invitation status to registered
    const { error: updateError } = await supabase
      .from("invited_users")
      .update({ status: "registered" })
      .eq("email", email);

    if (updateError) {
      console.error("Error updating invitation status:", updateError);
      return { error: updateError.message };
    }

    console.log(
      `Successfully added user to ${invitations.length} groups from invitations`
    );

    // Revalidate dashboard to reflect changes
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `User added to ${invitations.length} groups from invitations`,
      groups: invitations.map(i => i.group_id)
    };
  } catch (error: any) {
    console.error("Error processing invitations:", error);
    return { error: error.message || "Unknown error" };
  }
}
