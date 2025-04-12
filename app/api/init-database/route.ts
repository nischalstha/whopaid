import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Direct SQL to create tables without functions
const setupSQL = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create expense_splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(expense_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
DROP POLICY IF EXISTS "Users can read their own data" ON users;
CREATE POLICY "Users can read their own data" ON users
FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users
FOR UPDATE USING (auth.uid() = id);

-- Users can read groups they are members of
DROP POLICY IF EXISTS "Users can read groups they are members of" ON groups;
CREATE POLICY "Users can read groups they are members of" ON groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

-- Users can create groups
DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups" ON groups
FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update groups they are admins of
DROP POLICY IF EXISTS "Users can update groups they are admins of" ON groups;
CREATE POLICY "Users can update groups they are admins of" ON groups
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
    AND group_members.is_admin = TRUE
  )
);

-- Users can delete groups they are admins of
DROP POLICY IF EXISTS "Users can delete groups they are admins of" ON groups;
CREATE POLICY "Users can delete groups they are admins of" ON groups
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
    AND group_members.is_admin = TRUE
  )
);

-- Users can read group members for groups they are members of
DROP POLICY IF EXISTS "Users can read group members for groups they are members of" ON group_members;
CREATE POLICY "Users can read group members for groups they are members of" ON group_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members AS gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  )
);

-- Users can add members to groups they are admins of
DROP POLICY IF EXISTS "Users can add members to groups they are admins of" ON group_members;
CREATE POLICY "Users can add members to groups they are admins of" ON group_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members AS gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.is_admin = TRUE
  )
);

-- Users can update group members for groups they are admins of
DROP POLICY IF EXISTS "Users can update group members for groups they are admins of" ON group_members;
CREATE POLICY "Users can update group members for groups they are admins of" ON group_members
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM group_members AS gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.is_admin = TRUE
  )
);

-- Users can delete group members for groups they are admins of
DROP POLICY IF EXISTS "Users can delete group members for groups they are admins of" ON group_members;
CREATE POLICY "Users can delete group members for groups they are admins of" ON group_members
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM group_members AS gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.is_admin = TRUE
  )
);

-- Users can read expenses for groups they are members of
DROP POLICY IF EXISTS "Users can read expenses for groups they are members of" ON expenses;
CREATE POLICY "Users can read expenses for groups they are members of" ON expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = expenses.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- Users can create expenses for groups they are members of
DROP POLICY IF EXISTS "Users can create expenses for groups they are members of" ON expenses;
CREATE POLICY "Users can create expenses for groups they are members of" ON expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = expenses.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- Users can update expenses they created
DROP POLICY IF EXISTS "Users can update expenses they created" ON expenses;
CREATE POLICY "Users can update expenses they created" ON expenses
FOR UPDATE USING (paid_by = auth.uid());

-- Users can delete expenses they created
DROP POLICY IF EXISTS "Users can delete expenses they created" ON expenses;
CREATE POLICY "Users can delete expenses they created" ON expenses
FOR DELETE USING (paid_by = auth.uid());

-- Users can read expense splits for expenses in groups they are members of
DROP POLICY IF EXISTS "Users can read expense splits for expenses in groups they are members of" ON expense_splits;
CREATE POLICY "Users can read expense splits for expenses in groups they are members of" ON expense_splits
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM expenses
    JOIN group_members ON expenses.group_id = group_members.group_id
    WHERE expenses.id = expense_splits.expense_id
    AND group_members.user_id = auth.uid()
  )
);

-- Users can create expense splits for expenses they created
DROP POLICY IF EXISTS "Users can create expense splits for expenses they created" ON expense_splits;
CREATE POLICY "Users can create expense splits for expenses they created" ON expense_splits
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM expenses
    WHERE expenses.id = expense_splits.expense_id
    AND expenses.paid_by = auth.uid()
  )
);

-- Create balance function
CREATE OR REPLACE FUNCTION get_balances(p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_name VARCHAR(255),
  balance DECIMAL(10, 2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH paid AS (
    SELECT 
      e.paid_by,
      SUM(e.amount) AS total_paid
    FROM expenses e
    WHERE e.group_id = p_group_id
    GROUP BY e.paid_by
  ),
  owed AS (
    SELECT 
      es.user_id,
      SUM(es.amount) AS total_owed
    FROM expense_splits es
    JOIN expenses e ON es.expense_id = e.id
    WHERE e.group_id = p_group_id
    GROUP BY es.user_id
  )
  SELECT 
    u.id AS user_id,
    u.name AS user_name,
    COALESCE(p.total_paid, 0) - COALESCE(o.total_owed, 0) AS balance
  FROM users u
  JOIN group_members gm ON u.id = gm.user_id
  LEFT JOIN paid p ON u.id = p.paid_by
  LEFT JOIN owed o ON u.id = o.user_id
  WHERE gm.group_id = p_group_id;
END;
$$;

-- Create user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_balances TO authenticated;
`

export async function GET() {
  try {
    // Use service role to bypass RLS
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        options: {
          db: { schema: "public" },
        },
      },
    )

    // Execute each statement separately
    const statements = setupSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)
      .map((stmt) => stmt + ";")

    const results = []

    for (const statement of statements) {
      try {
        // Execute the SQL statement directly
        const { data, error } = await supabase
          .rpc("execute_sql_direct", {
            sql_query: statement,
          })
          .catch(() => {
            // If the RPC doesn't exist, try a direct query
            return supabase.from("_direct_query").select("*").eq("query", statement)
          })

        if (error) {
          results.push({ statement: statement.substring(0, 50) + "...", success: false, error: error.message })
        } else {
          results.push({ statement: statement.substring(0, 50) + "...", success: true })
        }
      } catch (error: any) {
        results.push({ statement: statement.substring(0, 50) + "...", success: false, error: error.message })
      }
    }

    // Check if tables were created
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

    return NextResponse.json({
      success: true,
      message: "Database initialization attempted",
      results,
      tableChecks,
    })
  } catch (error: any) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
