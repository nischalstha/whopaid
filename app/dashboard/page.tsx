import { PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GroupSelector } from "@/components/group-selector"
import { ExpenseList } from "@/components/expense-list"
import { BalanceSummary } from "@/components/balance-summary"

export default function DashboardPage() {
  // In a real app, we would check if the user is authenticated
  // If not, redirect to the sign-in page
  // const isAuthenticated = false
  // if (!isAuthenticated) {
  //   redirect("/sign-in")
  // }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2 font-bold">
            <span className="text-xl">WhoPaid</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Sign Out
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <GroupSelector />
              <Button variant="outline" size="sm">
                ⚙ Settings
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Group Summary</CardTitle>
                  <CardDescription>Iceland 2025</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium">Members</div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <div className="inline-flex h-8 items-center rounded-full border bg-background px-3 text-sm">
                          You
                        </div>
                        <div className="inline-flex h-8 items-center rounded-full border bg-background px-3 text-sm">
                          Alex
                        </div>
                        <div className="inline-flex h-8 items-center rounded-full border bg-background px-3 text-sm">
                          Priya
                        </div>
                        <div className="inline-flex h-8 items-center rounded-full border bg-background px-3 text-sm">
                          Jordan
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Total Spent</div>
                      <div className="text-2xl font-bold">$4,367</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <BalanceSummary />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Recent Expenses</h2>
              <Button className="gap-1.5">
                <PlusCircle className="h-4 w-4" />
                Add Expense
              </Button>
            </div>
            <ExpenseList />
          </div>
        </div>
      </main>
    </div>
  )
}
