import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
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

    const logs = []
    logs.push("Starting database setup...")

    // Execute each table creation and setup step individually
    // This avoids the need for the execute_sql function

    try {
      // Check if users table already exists
      const { error: checkUsersError } = await supabase.from("users").select("id").limit(1)

      if (
        checkUsersError &&
        checkUsersError.message.includes("relation") &&
        checkUsersError.message.includes("does not exist")
      ) {
        logs.push("Creating users table...")

        // Create users table with direct query
        const { error: createUsersError } = await supabase.rpc("create_users_table")

        if (createUsersError) {
          logs.push(`Error creating users table: ${createUsersError.message}`)

          // If the RPC doesn't exist, we need to create it first
          logs.push("Creating setup functions...")
          const { error: createFunctionError } = await supabase.rpc("setup_database")

          if (createFunctionError) {
            logs.push(`Error creating setup functions: ${createFunctionError.message}`)

            // As a last resort, try to create the tables using the REST API
            logs.push("Attempting to create tables using REST API...")

            // Create users table
            const createUsersTableQuery = `
              CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
              );
            `

            const usersResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                apikey: process.env.SUPABASE_ANON_KEY || "",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({
                query: createUsersTableQuery,
              }),
            })

            if (!usersResponse.ok) {
              const errorText = await usersResponse.text()
              logs.push(`Error creating users table via REST: ${errorText}`)
              throw new Error(`Failed to create users table: ${errorText}`)
            }

            logs.push("Users table created via REST API")
          } else {
            logs.push("Setup functions created successfully")

            // Try creating the tables again
            const { error: retryError } = await supabase.rpc("create_tables")

            if (retryError) {
              logs.push(`Error creating tables: ${retryError.message}`)
              throw new Error(`Failed to create tables: ${retryError.message}`)
            }

            logs.push("Tables created successfully")
          }
        } else {
          logs.push("Users table created successfully")
        }
      } else {
        logs.push("Users table already exists, skipping creation")
      }

      // Check and create other tables
      const tables = [
        { name: "groups", check: "groups" },
        { name: "group_members", check: "group_members" },
        { name: "expenses", check: "expenses" },
        { name: "expense_splits", check: "expense_splits" },
      ]

      for (const table of tables) {
        const { error: checkError } = await supabase.from(table.check).select("id").limit(1)

        if (checkError && checkError.message.includes("relation") && checkError.message.includes("does not exist")) {
          logs.push(`Creating ${table.name} table...`)

          const { error: createError } = await supabase.rpc(`create_${table.name}_table`)

          if (createError) {
            logs.push(`Error creating ${table.name} table: ${createError.message}`)
          } else {
            logs.push(`${table.name} table created successfully`)
          }
        } else {
          logs.push(`${table.name} table already exists, skipping creation`)
        }
      }

      // Set up RLS policies
      logs.push("Setting up RLS policies...")
      const { error: rlsError } = await supabase.rpc("setup_rls_policies")

      if (rlsError) {
        logs.push(`Error setting up RLS policies: ${rlsError.message}`)
      } else {
        logs.push("RLS policies set up successfully")
      }

      // Create balance function
      logs.push("Creating balance function...")
      const { error: balanceFunctionError } = await supabase.rpc("create_balance_function")

      if (balanceFunctionError) {
        logs.push(`Error creating balance function: ${balanceFunctionError.message}`)
      } else {
        logs.push("Balance function created successfully")
      }

      // Create user trigger
      logs.push("Creating user trigger...")
      const { error: triggerError } = await supabase.rpc("create_user_trigger")

      if (triggerError) {
        logs.push(`Error creating user trigger: ${triggerError.message}`)
      } else {
        logs.push("User trigger created successfully")
      }

      // Create current user in users table if not exists
      logs.push("Ensuring current user exists in users table...")
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single()

      if (userError && userError.code === "PGRST116") {
        // User doesn't exist, create them
        const { error: insertError } = await supabase.from("users").insert({
          id: session.user.id,
          name: session.user.user_metadata.name || "User",
          email: session.user.email || "",
        })

        if (insertError) {
          logs.push(`Error creating user record: ${insertError.message}`)
        } else {
          logs.push("User record created successfully")
        }
      } else if (userError) {
        logs.push(`Error checking user: ${userError.message}`)
      } else {
        logs.push("User already exists in users table")
      }
    } catch (error: any) {
      logs.push(`Error during setup: ${error.message}`)
      console.error("Setup error:", error)
    }

    logs.push("Database setup completed!")

    return NextResponse.json({ success: true, logs })
  } catch (error: any) {
    console.error("Error setting up database:", error)
    return NextResponse.json(
      {
        error: "Database setup error",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
