"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"

export async function createGroup(formData: FormData) {
  try {
    // Initialize Supabase client
    const supabase = createServerActionClient<Database>({ cookies })

    // Validate session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError)
      return { error: `Authentication error: ${sessionError.message}` }
    }

    if (!session) {
      return { error: "Not authenticated. Please sign in again." }
    }

    // Get form data
    const name = formData.get("name") as string
    const membersInput = formData.get("members") as string

    if (!name) {
      return { error: "Group name is required" }
    }

    console.log("Creating group:", name, "for user:", session.user.id)

    // First, let's check if we can query the database at all
    const { data: testData, error: testError } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.user.id)
      .single()

    if (testError) {
      console.error("Test query error:", testError)
      return {
        error: `Database connection test failed: ${testError.message || "Unknown error"}`,
        details: JSON.stringify(testError),
      }
    }

    // Try a simpler insert approach
    const groupData = {
      name,
      created_by: session.user.id,
    }

    console.log("Inserting group with data:", groupData)

    // Create the group - using a simpler approach first
    const { data: insertedGroup, error: insertError } = await supabase.from("groups").insert(groupData).select()

    if (insertError) {
      console.error("Error inserting group:", insertError)
      return {
        error: `Database error creating group: ${insertError.message || "Unknown error"}`,
        details: JSON.stringify(insertError),
        code: insertError.code,
      }
    }

    if (!insertedGroup || insertedGroup.length === 0) {
      return {
        error: "Failed to create group: No data returned",
        details: "The insert operation succeeded but no data was returned",
      }
    }

    const group = insertedGroup[0]
    console.log("Group created:", group)

    // Add the creator as an admin member
    const memberData = {
      group_id: group.id,
      user_id: session.user.id,
      is_admin: true,
    }

    console.log("Adding creator as member with data:", memberData)

    const { error: memberError } = await supabase.from("group_members").insert(memberData)

    if (memberError) {
      console.error("Error adding creator as member:", memberError)
      return {
        error: `Error adding you as a member: ${memberError.message || "Unknown error"}`,
        details: JSON.stringify(memberError),
        code: memberError.code,
      }
    }

    console.log("Creator added as admin member")

    // Add other members if provided
    const memberResults = []
    if (membersInput) {
      const memberEmails = membersInput
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean)

      console.log("Processing member emails:", memberEmails)

      for (const email of memberEmails) {
        try {
          // Check if user exists
          const { data: existingUser, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single()

          if (userError) {
            if (userError.code === "PGRST116") {
              console.log(`User with email ${email} does not exist. Invitation would be sent.`)
              memberResults.push({ email, status: "not_found" })
              continue
            } else {
              console.error(`Error checking user with email ${email}:`, userError)
              memberResults.push({ email, status: "error", error: userError.message })
              continue
            }
          }

          if (existingUser) {
            console.log(`Adding existing user ${existingUser.id} to group`)
            // Add existing user to group
            const { error: addMemberError } = await supabase.from("group_members").insert({
              group_id: group.id,
              user_id: existingUser.id,
              is_admin: false,
            })

            if (addMemberError) {
              console.error(`Error adding member ${existingUser.id} to group:`, addMemberError)
              memberResults.push({ email, status: "error", error: addMemberError.message })
            } else {
              memberResults.push({ email, status: "added" })
            }
          }
        } catch (memberError: any) {
          console.error(`Error processing member ${email}:`, memberError)
          memberResults.push({
            email,
            status: "error",
            error: memberError.message || "Unknown error",
          })
        }
      }
    }

    revalidatePath("/dashboard")
    return {
      success: true,
      groupId: group.id,
      memberResults,
    }
  } catch (error: any) {
    console.error("Unexpected error creating group:", error)
    return {
      error: `Unexpected error: ${error.message || "Unknown error"}`,
      details: error.stack || JSON.stringify(error),
    }
  }
}
