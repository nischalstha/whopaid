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

interface SplitUser {
  id: string;
  type: "registered" | "invited";
  email?: string;
}

export async function addExpense(formData: FormData) {
  // Initialize Supabase client with proper async handling
  const supabase = await getSupabaseClient();

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Not authenticated" };
  }

  const title = formData.get("title") as string;
  const amountStr = formData.get("amount") as string;
  const amount = Number.parseFloat(amountStr);
  const groupId = formData.get("groupId") as string;
  const paidBy = formData.get("paidBy") as string;
  const paidByType = formData.get("paidByType") as string;
  const note = formData.get("note") as string;

  // Collect all split users with their types
  const splitUserIds = formData.getAll("splitBetween") as string[];
  const splitUserTypes = formData.getAll("splitBetweenType") as string[];
  const splitUserEmails = formData.getAll("splitBetweenEmail") as string[];

  if (
    !title ||
    isNaN(amount) ||
    !groupId ||
    !paidBy ||
    splitUserIds.length === 0
  ) {
    return { error: "Missing required fields" };
  }

  // Create array of users to split between with their types
  const splitBetween: SplitUser[] = splitUserIds.map((id, index) => ({
    id,
    type: (splitUserTypes[index] || "registered") as "registered" | "invited",
    email: splitUserEmails[index] || undefined
  }));

  try {
    // Check if the payer is in invited_users table
    if (paidByType === "invited") {
      // Need to verify if invited user exists
      const { data: invitedUser } = await supabase
        .from("invited_users")
        .select("id")
        .eq("id", paidBy)
        .single();

      if (!invitedUser) {
        return { error: "Invited user not found" };
      }
    }

    // Create the expense with reference to who paid
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        title,
        amount,
        group_id: groupId,
        paid_by: paidBy, // This will be either a user.id or invited_user.id
        note: note || null,
        is_paid_by_invited_user: paidByType === "invited" // Add this flag to track if payer is invited user
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    // Calculate split amount
    const splitAmount = amount / splitBetween.length;

    // Create expense splits for each user
    const splitInserts = splitBetween.map(user => {
      // For registered users, use regular approach
      if (user.type === "registered") {
        return {
          expense_id: expense.id,
          user_id: user.id,
          amount: splitAmount,
          is_invited_user: false,
          invited_user_email: null
        };
      }
      // For invited users, set the flag and store email
      else {
        // Instead of throwing an error, use a placeholder email if none provided
        const userEmail =
          user.email || `invited-user-${user.id}@placeholder.com`;
        return {
          expense_id: expense.id,
          user_id: user.id, // This is the invited_users.id
          amount: splitAmount,
          is_invited_user: true,
          invited_user_email: userEmail
        };
      }
    });

    // Only insert expense splits for users who are actually included in the split
    if (splitInserts.length > 0) {
      const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(splitInserts);

      if (splitError) throw splitError;
    }

    // Ensure proper revalidation of the dashboard route
    revalidatePath("/dashboard");

    return { success: true, expenseId: expense.id };
  } catch (error: any) {
    console.error("Error adding expense:", error);
    return { error: error.message || "Failed to add expense" };
  }
}
