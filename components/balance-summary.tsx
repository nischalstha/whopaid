"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// First, let's add a type for the balance data from the database
interface BalanceData {
  user_id: string;
  user_name: string;
  balance: number;
  user_type: string; // Add the user_type field
}

interface ProcessedBalance {
  person: string;
  amount: number;
  direction: "owe" | "owed";
  userType: string;
}

export function BalanceSummary({
  groupId,
  userId
}: {
  groupId?: string;
  userId: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<
    {
      person: string;
      amount: number;
      direction: "owe" | "owed";
      userType: string;
    }[]
  >([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!groupId || !userId) {
      setIsLoading(false);
      return;
    }

    const fetchBalances = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch balances using the get_balances function
        const { data: balanceData, error: balanceError } = await supabase.rpc(
          "get_balances",
          {
            p_group_id: groupId
          }
        );

        console.log("get_balances data:", balanceData); // Debugging log

        if (balanceError) {
          console.error("Error fetching balances:", balanceError); // Debugging log
          setError(balanceError.message || "Failed to fetch balances");
          setIsLoading(false);
          return;
        }

        // Find if the current user is in the response data
        const currentUserBalance = balanceData?.find(
          (b: BalanceData) => b.user_id === userId
        );

        console.log("Current user balance:", currentUserBalance); // Debugging log

        // If the current user has a negative balance (they owe money), fetch settlements
        if (currentUserBalance && currentUserBalance.balance < 0) {
          // Use the new get_settlements function to get who the user owes money to
          const { data: settlementsData, error: settlementsError } =
            await supabase.rpc("get_settlements", {
              p_group_id: groupId,
              p_user_id: userId
            });

          if (settlementsError) {
            console.error("Error fetching settlements:", settlementsError);
            setError(settlementsError.message || "Failed to fetch settlements");
            setIsLoading(false);
            return;
          }

          console.log("Settlements data:", settlementsData);

          // Process the settlements data
          const processedBalances = settlementsData.map((settlement: any) => ({
            person: settlement.person,
            amount: settlement.amount,
            direction: settlement.direction as "owe" | "owed",
            userType: settlement.userType
          }));

          setBalances(processedBalances);
          setIsLoading(false);
          return;
        }

        // If the current user has a positive balance (others owe them), calculate who owes them
        if (currentUserBalance && currentUserBalance.balance > 0) {
          // For users who are owed money, we need to calculate who owes them
          // This is a bit more complex and might need a separate function in the future
          // For now, we'll use a simplified approach
          const processedBalances = balanceData
            .filter((b: BalanceData) => b.user_id !== userId && b.balance < 0)
            .map((balance: BalanceData) => {
              // Calculate what portion of their debt is owed to me
              const totalNegativeBalance = balanceData
                .filter((u: BalanceData) => u.balance < 0)
                .reduce(
                  (sum: number, u: BalanceData) => sum + Math.abs(u.balance),
                  0
                );

              // Calculate proportional share of what they owe me
              const share = currentUserBalance.balance / totalNegativeBalance;
              const directDebt = Math.abs(balance.balance) * share;

              return {
                person: balance.user_name,
                amount: Math.round(directDebt * 100) / 100,
                direction: "owed" as "owe" | "owed",
                userType: balance.user_type
              };
            })
            // Filter out zero or very small amounts
            .filter((balance: ProcessedBalance) => balance.amount > 0.01)
            // Sort by amount descending
            .sort(
              (a: ProcessedBalance, b: ProcessedBalance) => b.amount - a.amount
            );

          setBalances(processedBalances);
          setIsLoading(false);
          return;
        }

        // If the current user has a zero balance, there's nothing to show
        setBalances([]);
        setIsLoading(false);
      } catch (error: any) {
        console.error("Error fetching balances:", error);
        setError(error.message || "Failed to fetch balances");
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [groupId, userId, supabase]);

  // Helper function to get witty descriptions for balance amounts
  const getBalanceMessage = (amount: number, direction: "owe" | "owed") => {
    if (direction === "owe") {
      if (amount > 200) return "Time to sell a kidney?";
      if (amount > 100) return "That's a lot of ramen packets...";
      if (amount > 50) return "No more coffee for you.";
      if (amount > 20) return "Skip lunch once?";
      return "Pocket change. Probably.";
    } else {
      if (amount > 200) return "Time to collect!";
      if (amount > 100) return "Start dropping hints.";
      if (amount > 50) return "Send them this screenshot.";
      if (amount > 20) return "They can probably afford this.";
      return "Let it slide or demand payment?";
    }
  };

  // Helper to generate mood-based colors for gradients
  const getMoodGradient = (direction: "owe" | "owed", amount: number) => {
    const isOwed = direction === "owed";
    const intensity = Math.min(Math.log(amount + 1) / 5, 1); // Logarithmic scale

    if (isOwed) {
      return `linear-gradient(135deg, rgba(167, 243, 208, ${
        0.5 + intensity * 0.5
      }) 0%, rgba(110, 231, 183, ${0.4 + intensity * 0.6}) 100%)`;
    } else {
      return `linear-gradient(135deg, rgba(254, 226, 226, ${
        0.5 + intensity * 0.5
      }) 0%, rgba(248, 180, 180, ${0.4 + intensity * 0.6}) 100%)`;
    }
  };

  // Helper to get user type badge
  const getUserTypeBadge = (userType: string) => {
    if (userType === "invited") {
      return (
        <span className="ml-1 text-xs px-1 py-0.5 bg-blue-50 text-blue-600 rounded-full">
          Invited
        </span>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pt-4 px-6 pb-0">
        <CardTitle className="text-base">Balance Summary</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="space-y-3">
          {isLoading ? (
            <motion.div
              className="py-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="w-8 h-8 border-4 border-t-blue-500 border-slate-200 rounded-full mx-auto mb-2"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <p className="text-muted-foreground">
                Calculating your balances...
              </p>
            </motion.div>
          ) : error ? (
            <motion.p
              className="text-muted-foreground text-xs py-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          ) : balances.length === 0 ? (
            <motion.div
              className="bg-green-50 p-4 rounded-lg border border-green-100 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mx-auto mb-2 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 1,
                  delay: 0.2,
                  ease: "easeInOut"
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
              <motion.p
                className="text-green-800 font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                Perfectly balanced. As all things should be.
              </motion.p>
              <motion.p
                className="text-xs text-green-600 mt-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                Either you're all squared up or nobody's paid for anything yet.
              </motion.p>
            </motion.div>
          ) : (
            <div>
              <motion.div
                className="mb-4 relative h-2 bg-slate-100 rounded-full overflow-hidden"
                initial={{ opacity: 0, scaleX: 0.8 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5 }}
              >
                {balances.some(b => b.direction === "owe") && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 bg-red-400"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        100,
                        (balances
                          .filter(b => b.direction === "owe")
                          .reduce(
                            (sum: number, b: { amount: number }) =>
                              sum + b.amount,
                            0
                          ) /
                          balances.reduce(
                            (sum: number, b: { amount: number }) =>
                              sum + Math.abs(b.amount),
                            0
                          )) *
                          100
                      )}%`
                    }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                )}
                {balances.some(b => b.direction === "owed") && (
                  <motion.div
                    className="absolute right-0 top-0 bottom-0 bg-green-400"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        100,
                        (balances
                          .filter(b => b.direction === "owed")
                          .reduce(
                            (sum: number, b: { amount: number }) =>
                              sum + b.amount,
                            0
                          ) /
                          balances.reduce(
                            (sum: number, b: { amount: number }) =>
                              sum + Math.abs(b.amount),
                            0
                          )) *
                          100
                      )}%`
                    }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                )}
              </motion.div>
              <div className="flex justify-between text-xs text-muted-foreground mb-3 px-1">
                <motion.div
                  className="font-medium"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  You owe
                </motion.div>
                <motion.div
                  className="font-medium"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  You're owed
                </motion.div>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {balances.map((balance, index) => {
                  const isOwed = balance.direction === "owed";

                  return (
                    <motion.div
                      key={balance.person}
                      className="flex items-center justify-between p-3 rounded-md border border-slate-100 overflow-hidden"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      style={{
                        background: isOwed
                          ? "linear-gradient(to right, #f0fdf4, #ffffff)"
                          : "linear-gradient(to right, #fef2f2, #ffffff)"
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            isOwed ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {isOwed ? (
                            <ArrowDownRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-tight flex items-center">
                            {balance.direction === "owe"
                              ? `You owe ${balance.person}`
                              : `${balance.person} owes you`}
                            {getUserTypeBadge(balance.userType)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-bold text-base ${
                            isOwed ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          ${Math.abs(balance.amount).toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="border-t mt-3 pt-2 flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  <span className="font-semibold">
                    {balances.filter(b => b.direction === "owe").length}
                  </span>{" "}
                  You Owe /
                  <span className="font-semibold">
                    {balances.filter(b => b.direction === "owed").length}
                  </span>{" "}
                  Owe You
                </span>
                <button className="text-blue-600 cursor-pointer hover:underline flex items-center gap-1 py-0.5 px-2 hover:bg-blue-50 rounded-full transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Settle up
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
