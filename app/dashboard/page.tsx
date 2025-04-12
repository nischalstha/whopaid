"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GroupSelector } from "@/components/group-selector"
import { ExpenseList } from "@/components/expense-list"
import { BalanceSummary } from "@/components/balance-summary"
import { AddExpenseDialog } from "@/components/add-expense-dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/lib/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [groups, setGroups] = useState<any[]>([])
  const [currentGroup, setCurrentGroup] = useState<any>(null)
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [totalSpent, setTotalSpent] = useState(0)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [databaseError, setDatabaseError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push("/sign-in")
      return
    }

    const fetchData = async () => {
      setIsLoadingData(true)

      try {
        // First, check if the users table exists
        const { error: testError } = await supabase.from("users").select("id").limit(1)

        if (testError) {
          // If the error indicates the table doesn't exist, just show loading
          if (testError.message.includes("relation") && testError.message.includes("does not exist")) {
            console.log("Tables not ready yet, waiting...")
            setDatabaseError("Database tables are being set up. Please wait a moment...")

            // Try to initialize the database
            await fetch("/api/init-database")

            // Wait a bit and then try again
            setTimeout(() => {
              setIsLoadingData(false)
              router.refresh()
            }, 3000)

            return
          } else {
            console.error("Error testing database:", testError)
            setDatabaseError(testError.message)
            setIsLoadingData(false)
            return
          }
        }

        // If we get here, tables exist, so fetch user's groups
        const { data: userGroups, error: groupsError } = await supabase
          .from("group_members")
          .select(`
            group_id,
            groups:group_id (
              id,
              name,
              created_at
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { foreignTable: "groups", ascending: false })

        if (groupsError) {
          console.error("Error fetching groups:", groupsError)
          setDatabaseError(groupsError.message)
          setIsLoadingData(false)
          return
        }

        const fetchedGroups = userGroups?.map((ug) => ug.groups) || []
        setGroups(fetchedGroups)

        // Get the current group (first one or from query param in a real app)
        const group = fetchedGroups[0]
        setCurrentGroup(group)

        if (group) {
          // Fetch group members
          const { data: members, error: membersError } = await supabase
            .from("group_members")
            .select(`
              user_id,
              is_admin,
              users:user_id (
                id,
                name,
                email
              )
            `)
            .eq("group_id", group.id)

          if (membersError) {
            console.error("Error fetching members:", membersError)
          } else {
            setGroupMembers(members || [])
          }

          // Fetch expenses
          const { data: groupExpenses, error: expensesError } = await supabase
            .from("expenses")
            .select(`
              id,
              title,
              amount,
              note,
              created_at,
              paid_by,
              users:paid_by (
                id,
                name
              )
            `)
            .eq("group_id", group.id)
            .order("created_at", { ascending: false })

          if (expensesError) {
            console.error("Error fetching expenses:", expensesError)
          } else {
            setExpenses(groupExpenses || [])

            // Calculate total spent
            const total = (groupExpenses || []).reduce((sum, expense) => sum + expense.amount, 0)
            setTotalSpent(total)
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setDatabaseError(error.message || "An unexpected error occurred")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [user, isLoading, supabase, router])

  if (isLoading || isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p>Loading...</p>
          {databaseError && <p className="text-sm text-muted-foreground mt-2">{databaseError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2 font-bold">
            <span className="text-xl">WhoPaid</span>
          </div>
          <nav className="flex items-center gap-4">
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">
          {databaseError && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
              <p className="font-medium">Database Error</p>
              <p className="text-sm">{databaseError}</p>
            </div>
          )}

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <h2 className="text-2xl font-bold mb-4">Welcome to WhoPaid!</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                You don't have any groups yet. Create your first group to start tracking expenses.
              </p>
              <GroupSelector userId={user?.id || ""} groups={[]} />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <GroupSelector userId={user?.id || ""} groups={groups} />
                <Button variant="outline" size="sm" asChild>
                  <a href="/dashboard/settings">⚙ Settings</a>
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Group Summary</CardTitle>
                    <CardDescription>{currentGroup?.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium">Members</div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {groupMembers.map((member) => (
                            <div
                              key={member.user_id}
                              className="inline-flex h-8 items-center rounded-full border bg-background px-3 text-sm"
                            >
                              {member.user_id === user?.id ? "You" : member.users.name}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Total Spent</div>
                        <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <BalanceSummary groupId={currentGroup?.id} userId={user?.id || ""} />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Recent Expenses</h2>
                <AddExpenseDialog
                  trigger={
                    <Button className="gap-1.5">
                      <PlusCircle className="h-4 w-4" />
                      Add Expense
                    </Button>
                  }
                  groupId={currentGroup?.id}
                  groupMembers={groupMembers.map((m) => ({
                    id: m.user_id,
                    name: m.user_id === user?.id ? "You" : m.users.name,
                  }))}
                  userId={user?.id || ""}
                />
              </div>
              <ExpenseList expenses={expenses} currentUserId={user?.id || ""} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
