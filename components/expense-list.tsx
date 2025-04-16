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
  split_with_ids?: string[];
};

export function ExpenseList({
  expenses,
  currentUserId,
  currentUserName
}: {
  expenses: Expense[];
  currentUserId: string;
  currentUserName: string;
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
            <div key={group.date} className="mb-6">
              <div className="sticky top-0 z-10 bg-white border-b p-3 shadow-sm">
                <h3 className="font-medium text-xs text-slate-500">
                  {group.formattedDate}
                </h3>
              </div>
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-blue-200"></div>

                {group.expenses.map((expense, index) => {
                  const isPaidByCurrentUser = expense.paid_by === currentUserId;
                  const isIncludedInSplit =
                    expense.split_with_ids?.includes(currentUserId);
                  const amountColorClass = getAmountColorClass(expense.amount);
                  const moodColor = getMoodColor(expense.amount);

                  return (
                    <div key={expense.id} className="relative mb-6">
                      {/* Timeline dot */}
                      <div className="absolute left-5 top-4 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>

                      <div className="ml-6 bg-white rounded-lg border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            {/* Payer avatar */}
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-medium shadow-sm border border-blue-100">
                                {expense.users.name
                                  .split(" ")
                                  .map((n, i) => n.charAt(0).toUpperCase())
                                  .join("")}
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="text-base font-medium text-slate-900">
                                  {expense.title}
                                </h3>
                                <span className="ml-2 text-xs text-slate-400">
                                  {formatDate(expense.created_at)}
                                </span>
                              </div>

                              <p className="mt-1 text-sm text-slate-500">
                                Paid by{" "}
                                <span className="font-medium">
                                  {expense.users.name}
                                </span>
                              </p>

                              {expense.note && (
                                <p className="mt-2 text-sm text-slate-600 italic border-l-2 border-blue-200 pl-2">
                                  "{expense.note}"
                                </p>
                              )}

                              {/* Split with section */}
                              {expense.split_with &&
                                expense.split_with.length > 0 && (
                                  <div className="mt-3">
                                    <div className="flex items-center mb-1">
                                      <span className="text-xs font-medium text-slate-500 mr-2">
                                        Split with:
                                      </span>
                                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                        {expense.split_count ||
                                          expense.split_with.length}{" "}
                                        people
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {expense.split_with.map((name, i) => (
                                        <div
                                          key={i}
                                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                                        >
                                          {name}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-lg font-semibold ${amountColorClass}`}
                            >
                              ${expense.amount.toFixed(2)}
                            </p>
                            <div className="mt-2">
                              <span
                                className={`text-xs ${
                                  isPaidByCurrentUser
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : isIncludedInSplit
                                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                                    : "bg-gray-100 text-gray-700 border border-gray-200"
                                } px-2 py-1 rounded-full font-medium inline-block`}
                              >
                                {isPaidByCurrentUser
                                  ? "You get"
                                  : isIncludedInSplit
                                  ? "You owe"
                                  : "Not included"}{" "}
                                $
                                {isIncludedInSplit
                                  ? (
                                      expense.amount /
                                      (expense.split_count || 1)
                                    ).toFixed(2)
                                  : "0.00"}
                              </span>
                            </div>
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
