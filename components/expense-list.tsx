import { formatDistanceToNow } from "date-fns"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

const expenses = [
  {
    id: "1",
    title: "Dinner in Reykjavík",
    amount: 160,
    paidBy: "You",
    splitBetween: ["You", "Alex", "Priya", "Jordan"],
    date: new Date(2025, 5, 15),
  },
  {
    id: "2",
    title: "Airbnb Cleaning",
    amount: 80,
    paidBy: "Priya",
    splitBetween: ["You", "Alex", "Priya", "Jordan"],
    date: new Date(2025, 5, 14),
  },
  {
    id: "3",
    title: "Rental Car",
    amount: 320,
    paidBy: "Alex",
    splitBetween: ["You", "Alex", "Priya", "Jordan"],
    date: new Date(2025, 5, 13),
  },
  {
    id: "4",
    title: "Groceries",
    amount: 95.5,
    paidBy: "Jordan",
    splitBetween: ["You", "Alex", "Priya", "Jordan"],
    date: new Date(2025, 5, 12),
  },
]

export function ExpenseList() {
  return (
    <div className="space-y-4">
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-center text-muted-foreground">No expenses yet. Lucky you. Or freeloading friends.</p>
          </CardContent>
        </Card>
      ) : (
        expenses.map((expense) => (
          <Card key={expense.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-4">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback>{expense.paidBy.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{expense.title}</p>
                    <p className="font-bold">${expense.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <p>
                      Paid by {expense.paidBy}, split {expense.splitBetween.length} ways
                    </p>
                    <p>{formatDistanceToNow(expense.date, { addSuffix: true })}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
