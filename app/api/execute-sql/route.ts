import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: "Session error", details: sessionError }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get the SQL query from the request body
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "No SQL query provided" }, { status: 400 })
    }

    // Execute the SQL query
    const { data, error } = await supabase.rpc("execute_sql", { sql_query: query })

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ data })
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
