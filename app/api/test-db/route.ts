import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Test user table access
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single()

    // Test groups table access
    const { data: groupsData, error: groupsError } = await supabase.from("groups").select("*").limit(1)

    // Test creating a group
    const testGroupName = `Test Group ${Date.now()}`
    const { data: newGroup, error: createGroupError } = await supabase
      .from("groups")
      .insert({
        name: testGroupName,
        created_by: session.user.id,
      })
      .select()
      .single()

    // Clean up test group if created
    let deleteResult = null
    let deleteError = null
    if (newGroup) {
      const { data, error } = await supabase.from("groups").delete().eq("id", newGroup.id).select()

      deleteResult = data
      deleteError = error
    }

    return NextResponse.json({
      user: {
        data: userData,
        error: userError,
      },
      groups: {
        data: groupsData,
        error: groupsError,
      },
      createGroup: {
        data: newGroup,
        error: createGroupError,
      },
      deleteGroup: {
        data: deleteResult,
        error: deleteError,
      },
    })
  } catch (error) {
    console.error("Error testing database:", error)
    return NextResponse.json({ error: "Failed to test database" }, { status: 500 })
  }
}
