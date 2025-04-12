import { formatDistanceToNow } from "date-fns"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

type Expense = {
  id: string
  title: string
  amount: number
  paid_by: string
  users: {
    id: string
    name: string
  }
  created_at: string
}

export function ExpenseList({ expenses, currentUserId }: { expenses: Expense[]; currentUserId: string }) {
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
                  <AvatarFallback>
                    {expense.paid_by === currentUserId ? "Y" : expense.users.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{expense.title}</p>
                    <p className="font-bold">${expense.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <p>Paid by {expense.paid_by === currentUserId ? "You" : expense.users.name}</p>
                    <p>{formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}</p>
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
