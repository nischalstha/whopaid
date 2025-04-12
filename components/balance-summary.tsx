import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const balances = [
  {
    person: "Alex",
    amount: -122.5,
    direction: "owe",
  },
  {
    person: "Priya",
    amount: 88,
    direction: "owed",
  },
]

export function BalanceSummary() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Net Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {balances.length === 0 ? (
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
