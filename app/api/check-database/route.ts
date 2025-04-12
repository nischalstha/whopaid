import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if tables exist
    const tables = ["users", "groups", "group_members", "expenses", "expense_splits"]
    const tableChecks = []

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select("count(*)", { count: "exact", head: true })
        tableChecks.push({ table, exists: !error, error: error?.message })
      } catch (error: any) {
        tableChecks.push({ table, exists: false, error: error.message })
      }
    }

    // Check if get_balances function exists
    let balanceFunctionExists = false
    try {
      const { error } = await supabase.rpc("get_balances", { p_group_id: "00000000-0000-0000-0000-000000000000" })
      balanceFunctionExists = !error || !error.message.includes("function") || !error.message.includes("does not exist")
    } catch (error) {
      balanceFunctionExists = false
    }

    const allTablesExist = tableChecks.every((check) => check.exists)

    return NextResponse.json({
      ready: allTablesExist && balanceFunctionExists,
      tables: tableChecks,
      functions: {
        get_balances: balanceFunctionExists,
      },
    })
  } catch (error: any) {
    console.error("Error checking database:", error)
    return NextResponse.json(
      {
        ready: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
