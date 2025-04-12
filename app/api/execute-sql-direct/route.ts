import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the SQL query from the request body
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "No SQL query provided" }, { status: 400 })
    }

    // Execute the SQL query directly
    const { data, error } = await supabase.rpc("execute_sql_direct", { sql_query: query })

    if (error) {
      // If the RPC doesn't exist, try a direct query
      const { data: directData, error: directError } = await supabase
        .from("_direct_query")
        .select("*")
        .eq("query", query)

      if (directError) {
        return NextResponse.json({ error: directError.message, details: directError }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: directData })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "SQL execution error",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
