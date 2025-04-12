import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

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

  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase.rpc("get_tables")

    // Fallback if the RPC doesn't exist
    let tablesList = []
    if (tablesError) {
      // Try to query the information_schema directly
      const { data: schemaData, error: schemaError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")

      if (schemaError) {
        return NextResponse.json(
          {
            error: "Failed to check tables",
            sessionError,
            tablesError,
            schemaError,
          },
          { status: 500 },
        )
      }

      tablesList = schemaData || []
    } else {
      tablesList = tables || []
    }

    // Test user table
    const { data: userData, error: userError } = await supabase.from("users").select("*").limit(1)

    // Test groups table
    const { data: groupsData, error: groupsError } = await supabase.from("groups").select("*").limit(1)

    // Test RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("*")
      .in("tablename", ["users", "groups", "group_members"])
      .catch(() => ({ data: null, error: { message: "Failed to query policies" } }))

    return NextResponse.json({
      authenticated: true,
      user: session.user,
      tables: tablesList,
      testQueries: {
        users: { data: userData, error: userError },
        groups: { data: groupsData, error: groupsError },
      },
      policies: { data: policies, error: policiesError },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Debug API error",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
