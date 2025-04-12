type Expense = {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  users: {
    id: string;
    name: string;
  };
  created_at: string;
  note?: string | null;
  split_count?: number;
  split_with?: string[];
};

export function ExpenseList({
  expenses,
  currentUserId
}: {
  expenses: Expense[];
  currentUserId: string;
}) {
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  };

  // Group expenses by date for timeline view
  const groupExpensesByDate = (expenses: Expense[]) => {
    const groups: { [key: string]: Expense[] } = {};

    expenses.forEach(expense => {
      const date = new Date(expense.created_at);
      const dateKey = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).toISOString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(expense);
    });

    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        formattedDate: new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric"
        }).format(new Date(date)),
        expenses: items
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const groupedExpenses = groupExpensesByDate(expenses);

  // Determine if amount is high, medium or low for better visual cues
  const getAmountColorClass = (amount: number) => {
    if (amount > 200)
      return "from-red-200 to-red-100 text-red-700 border-red-200";
    if (amount > 100)
      return "from-orange-200 to-orange-100 text-orange-700 border-orange-200";
    if (amount > 50)
      return "from-yellow-200 to-yellow-100 text-yellow-700 border-yellow-200";
    return "from-green-200 to-green-100 text-green-700 border-green-200";
  };

  // Helper to generate witty expense notes based on amount
  const getRandomExpenseComment = (
    amount: number,
    isPaidByCurrentUser: boolean
  ) => {
    if (amount > 200) {
      return isPaidByCurrentUser
        ? "Ouch. That's ramen for a week."
        : "They're never gonna financially recover from this.";
    } else if (amount > 100) {
      return isPaidByCurrentUser
        ? "Your wallet felt that one."
        : "Hope they weren't saving for anything important.";
    } else if (amount > 50) {
      return isPaidByCurrentUser
        ? "That's a lot of dollar menu items."
        : "They probably want that money back.";
    } else if (amount > 20) {
      return isPaidByCurrentUser
        ? "There goes your coffee budget."
        : "That's like 5 fancy coffees.";
    } else {
      return isPaidByCurrentUser
        ? "Small price to pay. Probably."
        : "They won't miss this... much.";
    }
  };

  // Helper to get mood color based on amount
  const getMoodColor = (amount: number) => {
    if (amount > 200)
      return { bg: "rgba(254, 202, 202, 0.5)", text: "text-red-700" };
    if (amount > 100)
      return { bg: "rgba(254, 215, 170, 0.5)", text: "text-orange-700" };
    if (amount > 50)
      return { bg: "rgba(254, 240, 138, 0.5)", text: "text-yellow-700" };
    return { bg: "rgba(187, 247, 208, 0.5)", text: "text-green-700" };
  };

  return (
    <div className="divide-y">
      {expenses.length === 0 ? (
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground font-medium">
            Nothing to see here yet. Time to spot someone the bill?
          </p>
        </div>
      ) : (
        <div className="relative">
          {groupedExpenses.map(group => (
            <div key={group.date} className="mb-4">
              <div className="sticky top-0 z-10 bg-white border-b p-3 shadow-sm">
                <h3 className="font-medium text-xs text-slate-500">
                  {group.formattedDate}
                </h3>
              </div>
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200"></div>

                {group.expenses.map((expense, index) => {
                  const isPaidByCurrentUser = expense.paid_by === currentUserId;
                  const amountColorClass = getAmountColorClass(expense.amount);
                  const moodColor = getMoodColor(expense.amount);

                  return (
                    <div
                      key={expense.id}
                      className="relative z-0 pl-10 pr-3 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none"
                    >
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-300 z-10"></div>

                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${amountColorClass} flex items-center justify-center text-xs font-semibold border shadow-sm flex-shrink-0`}
                          >
                            {expense.users.name
                              .split(" ")
                              .map(name => name.charAt(0))
                              .join("")
                              .toUpperCase()
                              .substring(0, 2)}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-medium text-sm">
                                {expense.title}
                              </h3>
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full inline-flex items-center">
                                {expense.split_count || 3} 👥
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                              {isPaidByCurrentUser ? (
                                <span>
                                  You paid{" "}
                                  <span className="font-medium">
                                    ${expense.amount.toFixed(2)}
                                  </span>
                                </span>
                              ) : (
                                <span>
                                  <span className="font-medium">
                                    {expense.users.name}
                                  </span>{" "}
                                  paid{" "}
                                  <span className="font-medium">
                                    ${expense.amount.toFixed(2)}
                                  </span>
                                </span>
                              )}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(expense.split_with || [])
                                .slice(0, 3)
                                .map((person, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full"
                                  >
                                    {person}
                                  </span>
                                ))}
                              {(expense.split_with || []).length > 3 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full">
                                  +{(expense.split_with || []).length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right min-w-[120px] flex-shrink-0">
                          <div className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded inline-block">
                            {formatDate(expense.created_at)}
                          </div>
                          {expense.note && (
                            <div className="text-xs max-w-[12rem] truncate text-muted-foreground mt-1 italic py-0.5 px-1.5 bg-slate-50 rounded">
                              "{expense.note}"
                            </div>
                          )}
                          <div className="mt-1.5">
                            <span
                              className={`text-xs ${
                                isPaidByCurrentUser
                                  ? "bg-green-50 text-green-700"
                                  : "bg-orange-50 text-orange-700"
                              } px-1.5 py-0.5 rounded-full font-medium inline-block`}
                            >
                              {isPaidByCurrentUser ? "You get" : "You owe"} $
                              {(
                                expense.amount / (expense.split_count || 3)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
