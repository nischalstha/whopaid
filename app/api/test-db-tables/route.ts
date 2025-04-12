import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
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

    // Test if tables exist
    const tableTests = []

    // Test users table
    try {
      const { data: usersData, error: usersError } = await supabase.from("users").select("id, name, email").limit(1)

      tableTests.push({
        table: "users",
        exists: !usersError,
        error: usersError ? usersError.message : null,
        data: usersData,
      })
    } catch (error: any) {
      tableTests.push({
        table: "users",
        exists: false,
        error: error.message,
      })
    }

    // Test groups table
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("id, name, created_by")
        .limit(1)

      tableTests.push({
        table: "groups",
        exists: !groupsError,
        error: groupsError ? groupsError.message : null,
        data: groupsData,
      })
    } catch (error: any) {
      tableTests.push({
        table: "groups",
        exists: false,
        error: error.message,
      })
    }

    // Test group_members table
    try {
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("id, group_id, user_id")
        .limit(1)

      tableTests.push({
        table: "group_members",
        exists: !membersError,
        error: membersError ? membersError.message : null,
        data: membersData,
      })
    } catch (error: any) {
      tableTests.push({
        table: "group_members",
        exists: false,
        error: error.message,
      })
    }

    // Test expenses table
    try {
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("id, title, amount")
        .limit(1)

      tableTests.push({
        table: "expenses",
        exists: !expensesError,
        error: expensesError ? expensesError.message : null,
        data: expensesData,
      })
    } catch (error: any) {
      tableTests.push({
        table: "expenses",
        exists: false,
        error: error.message,
      })
    }

    // Test expense_splits table
    try {
      const { data: splitsData, error: splitsError } = await supabase
        .from("expense_splits")
        .select("id, expense_id, user_id")
        .limit(1)

      tableTests.push({
        table: "expense_splits",
        exists: !splitsError,
        error: splitsError ? splitsError.message : null,
        data: splitsData,
      })
    } catch (error: any) {
      tableTests.push({
        table: "expense_splits",
        exists: false,
        error: error.message,
      })
    }

    // Test insert capability with a temporary group
    let insertTest = null
    try {
      const testGroupName = `Test Group ${Date.now()}`

      const { data: insertedGroup, error: insertError } = await supabase
        .from("groups")
        .insert({
          name: testGroupName,
          created_by: session.user.id,
        })
        .select()

      if (insertError) {
        insertTest = {
          success: false,
          error: insertError.message,
          details: insertError,
        }
      } else if (!insertedGroup || insertedGroup.length === 0) {
        insertTest = {
          success: false,
          error: "No data returned from insert",
        }
      } else {
        // Clean up the test group
        const { error: deleteError } = await supabase.from("groups").delete().eq("id", insertedGroup[0].id)

        insertTest = {
          success: true,
          data: insertedGroup[0],
          cleanupSuccess: !deleteError,
          cleanupError: deleteError ? deleteError.message : null,
        }
      }
    } catch (error: any) {
      insertTest = {
        success: false,
        error: error.message,
        stack: error.stack,
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
      tableTests,
      insertTest,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Test API error",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
