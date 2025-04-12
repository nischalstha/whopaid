"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"

export async function addExpense(formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  const title = formData.get("title") as string
  const amountStr = formData.get("amount") as string
  const amount = Number.parseFloat(amountStr)
  const groupId = formData.get("groupId") as string
  const paidBy = formData.get("paidBy") as string
  const note = formData.get("note") as string
  const splitBetween = formData.getAll("splitBetween") as string[]

  if (!title || isNaN(amount) || !groupId || !paidBy || splitBetween.length === 0) {
    return { error: "Missing required fields" }
  }

  try {
    // Create the expense
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        title,
        amount,
        group_id: groupId,
        paid_by: paidBy,
        note: note || null,
      })
      .select()
      .single()

    if (expenseError) throw expenseError

    // Calculate split amount
    const splitAmount = amount / splitBetween.length

    // Create expense splits
    const splitInserts = splitBetween.map((userId) => ({
      expense_id: expense.id,
      user_id: userId,
      amount: splitAmount,
    }))

    const { error: splitError } = await supabase.from("expense_splits").insert(splitInserts)

    if (splitError) throw splitError

    revalidatePath("/dashboard")
    return { success: true, expenseId: expense.id }
  } catch (error: any) {
    console.error("Error adding expense:", error)
    return { error: error.message || "Failed to add expense" }
  }
}
