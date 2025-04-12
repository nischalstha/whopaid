"use client"

import { useEffect, useState } from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function BalanceSummary({ groupId, userId }: { groupId?: string; userId: string }) {
  const [balances, setBalances] = useState<{ person: string; amount: number; direction: "owe" | "owed" }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!groupId || !userId) {
      setIsLoading(false)
      return
    }

    const fetchBalances = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch balances using the get_balances function
        const { data, error } = await supabase.rpc("get_balances", {
          p_group_id: groupId,
        })

        if (error) {
          // Check if the error is because the function doesn't exist
          if (error.message.includes("function") && error.message.includes("does not exist")) {
            // Try to initialize the database
            await fetch("/api/init-database")
            setError("Balance calculation is being set up. Please refresh in a moment.")
            setIsLoading(false)
            return
          }

          throw error
        }

        if (data) {
          // Find current user's balance
          const currentUserBalance = data.find((b) => b.user_id === userId)

          // Process other users' balances relative to current user
          const processedBalances = data
            .filter((b) => b.user_id !== userId)
            .map((balance) => {
              // If current user has positive balance, others owe them
              // If current user has negative balance, they owe others
              const relativeToCurrent = currentUserBalance?.balance || 0

              if (relativeToCurrent > 0) {
                // Current user is owed money
                return {
                  person: balance.user_name,
                  amount: Math.abs(balance.balance),
                  direction: balance.balance < 0 ? "owed" : "owe",
                }
              } else {
                // Current user owes money
                return {
                  person: balance.user_name,
                  amount: Math.abs(balance.balance),
                  direction: balance.balance > 0 ? "owe" : "owed",
                }
              }
            })

          setBalances(processedBalances)
        }
      } catch (error: any) {
        console.error("Error fetching balances:", error)
        setError(error.message || "Failed to fetch balances")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalances()
  }, [groupId, userId, supabase])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Net Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading balances...</p>
          ) : error ? (
            <p className="text-muted-foreground text-sm">{error}</p>
          ) : balances.length === 0 ? (
            <p className="text-muted-foreground">All settled up! Nice work.</p>
          ) : (
            balances.map((balance) => (
              <div key={balance.person} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {balance.direction === "owe" ? (
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-green-500" />
                  )}
                  <span>
                    {balance.direction === "owe" ? `You owe ${balance.person}` : `You're owed by ${balance.person}`}
                  </span>
                </div>
                <span className={`font-bold ${balance.direction === "owe" ? "text-destructive" : "text-green-500"}`}>
                  ${Math.abs(balance.amount).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
