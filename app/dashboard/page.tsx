"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, X } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { GroupSelector } from "@/components/group-selector";
import { ExpenseList } from "@/components/expense-list";
import { BalanceSummary } from "@/components/balance-summary";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExpensesByMember {
  name: string;
  userId: string;
  total: number;
  color: string;
  percentage: number;
  displayPercentage: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  interface Group {
    id: string;
    name: string;
    created_at: string;
  }

  interface GroupMember {
    user_id: string;
    is_admin: boolean;
    type?: "registered" | "invited";
    status?: string;
    users: {
      id: string;
      name: string;
      email: string;
    };
  }

  interface Expense {
    id: string;
    title: string;
    amount: number;
    note: string | null;
    created_at: string;
    paid_by: string;
    users: {
      id: string;
      name: string;
    };
  }

  interface SupabaseGroupMember {
    user_id: string;
    is_admin: boolean;
    users: {
      id: string;
      name: string;
      email: string;
    };
  }

  interface SupabaseExpense {
    id: string;
    title: string;
    amount: number;
    note: string | null;
    created_at: string;
    paid_by: string;
    users: {
      id: string;
      name: string;
    };
  }

  interface SupabaseGroupResponse {
    group_id: string;
    groups: {
      id: string;
      name: string;
      created_at: string;
    };
  }

  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Add state to track filtered user
  const [filteredUserId, setFilteredUserId] = useState<string | null>(null);

  // Add a state for the active tab
  const [activeTab, setActiveTab] = useState<"balance" | "summary">("balance");

  // Add a state for tracking GroupSelector dropdown
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);

  // Add state for controlling the create group dialog
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);

  // Add member state and functions needed for creating groups
  const [members, setMembers] = useState([{ name: "", email: "" }]);
  const [isCreating, setIsCreating] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Add error state for create group
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  const calculateExpensesByMember = (expenses: any[], groupMembers: any[]) => {
    const colors = [
      "#4ade80",
      "#60a5fa",
      "#f97316",
      "#8b5cf6",
      "#ec4899",
      "#facc15",
      "#14b8a6",
      "#f43f5e",
      "#84cc16",
      "#06b6d4",
      "#a855f7",
      "#10b981"
    ];

    const expenseMap: { [key: string]: number } = {};

    expenses.forEach(expense => {
      const userId = expense.paid_by;
      if (!expenseMap[userId]) {
        expenseMap[userId] = 0;
      }
      expenseMap[userId] += expense.amount;
    });

    const totalExpenses = Object.values(expenseMap).reduce(
      (sum, amount) => sum + amount,
      0
    );

    const expensesByMember: ExpensesByMember[] = Object.entries(expenseMap)
      .map(([userId, total], index) => {
        const member = groupMembers.find(m => m.user_id === userId);
        const rawPercentage =
          totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;

        // Ensure any contribution shows at least 1% (for visual clarity)
        const displayPercentage =
          total > 0 && rawPercentage < 1 ? 1 : Math.round(rawPercentage);

        return {
          name: member ? member.users.name : "Unknown",
          userId,
          total,
          color: colors[index % colors.length],
          percentage: rawPercentage,
          displayPercentage: displayPercentage
        };
      })
      .sort((a, b) => b.total - a.total);

    return { expensesByMember, totalExpenses };
  };

  const ExpensePieChart = ({ data }: { data: ExpensesByMember[] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (!canvasRef.current || data.length === 0) return;

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      const centerX = canvasRef.current.width / 2;
      const centerY = canvasRef.current.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      let startAngle = 0;
      data.forEach(item => {
        const sliceAngle = (item.percentage / 100) * 2 * Math.PI;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();

        ctx.fillStyle = item.color;
        ctx.fill();

        startAngle += sliceAngle;
      });

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
      ctx.fillStyle = "white";
      ctx.fill();
    }, [data]);

    return (
      <div className="relative">
        <canvas ref={canvasRef} width={200} height={200} className="mx-auto" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm font-small">Total</div>
            <div className="text-sm font-bold">
              ${data.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add function to handle group selection
  const handleGroupChange = async (group: Group) => {
    setCurrentGroup(group);
    if (group) {
      setIsLoadingData(true);
      await fetchGroupData(group);
      setIsLoadingData(false);
    }
  };

  // Add function to fetch group data
  const fetchGroupData = async (group: Group) => {
    if (!group) return;

    try {
      console.log("Fetching data for group:", group.id);

      // Fetch group members
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select(
          `
          user_id,
          is_admin,
          users:user_id (
            id,
            name,
            email
          )
        `
        )
        .eq("group_id", group.id);

      if (membersError) {
        console.error("Error fetching members:", membersError);
        throw membersError;
      }

      console.log("Fetched members:", members);
      const typedMembers = (members || []) as unknown as SupabaseGroupMember[];

      // Fetch invited users for this group
      const { data: invitedUsers, error: invitedError } = await supabase
        .from("invited_users")
        .select("*")
        .eq("group_id", group.id);

      if (invitedError) {
        console.error("Error fetching invited users:", invitedError);
        throw invitedError;
      }

      console.log("Fetched invited users:", invitedUsers);

      // Combine regular members and invited users
      const registeredMembers = typedMembers.map(member => ({
        user_id: member.user_id,
        is_admin: member.is_admin,
        type: "registered" as const,
        users: {
          id: member.users.id,
          name: member.users.name,
          email: member.users.email
        }
      }));

      const invitedMembers = (invitedUsers || []).map(invited => ({
        user_id: invited.id, // Use the invited user's ID as user_id for display
        is_admin: false,
        type: "invited" as const,
        status: invited.status,
        users: {
          id: invited.id,
          name: invited.name,
          email: invited.email
        }
      }));

      setGroupMembers([...registeredMembers, ...invitedMembers]);

      // Fetch expenses with a more complex query that handles invited users
      const { data: groupExpenses, error: expensesError } = await supabase
        .from("expenses")
        .select(
          `
          id,
          title,
          amount,
          note,
          created_at,
          paid_by,
          is_paid_by_invited_user
        `
        )
        .eq("group_id", group.id)
        .order("created_at", { ascending: false });

      if (expensesError) {
        console.error("Error fetching expenses:", expensesError);
        throw expensesError;
      }

      // Now fetch details for each payer, depending on whether they're invited or registered
      const enhancedExpenses = await Promise.all(
        (groupExpenses || []).map(async expense => {
          // Get payer details
          const userDetails = expense.is_paid_by_invited_user
            ? await supabase
                .from("invited_users")
                .select("id, name")
                .eq("id", expense.paid_by)
                .single()
                .then(({ data }) => data)
            : await supabase
                .from("users")
                .select("id, name")
                .eq("id", expense.paid_by)
                .single()
                .then(({ data }) => data);

          // Get split details
          const { data: splitDetails } = await supabase
            .from("expense_splits")
            .select(
              `
              amount,
              user_id,
              is_invited_user,
              invited_user_email
            `
            )
            .eq("expense_id", expense.id);

          // Get names of people involved in the split
          const splitNames = await Promise.all(
            (splitDetails || []).map(async split => {
              if (split.is_invited_user) {
                // Try to get from invited_users
                const { data } = await supabase
                  .from("invited_users")
                  .select("name")
                  .eq("id", split.user_id)
                  .single();
                return data?.name || "Unknown";
              } else {
                // Get from users
                const { data } = await supabase
                  .from("users")
                  .select("name")
                  .eq("id", split.user_id)
                  .single();
                return data?.name || "Unknown";
              }
            })
          );

          return {
            ...expense,
            users: userDetails || { id: expense.paid_by, name: "Unknown User" },
            split_count: splitDetails?.length || 0,
            split_with: splitNames
          };
        })
      );

      console.log("Fetched expenses:", enhancedExpenses);
      setExpenses(enhancedExpenses);

      // Calculate total spent
      const total = enhancedExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      setTotalSpent(total);
    } catch (error: any) {
      console.error("Error fetching group data:", error);
      setDatabaseError(error.message || "An unexpected error occurred");
    }
  };

  // Effect to handle URL changes
  useEffect(() => {
    if (typeof window !== "undefined" && groups.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const groupId = params.get("group");

      const group = groupId ? groups.find(g => g.id === groupId) : groups[0];

      if (group && (!currentGroup || currentGroup.id !== group.id)) {
        handleGroupChange(group);
      }
    }
  }, [groups, window?.location.search]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    const fetchData = async () => {
      setIsLoadingData(true);
      console.log("Starting data fetch with user ID:", user.id);

      try {
        // First, let's try a simple query to test database connection
        const { data: testData, error: testError } = await supabase
          .from("group_members")
          .select("*")
          .limit(1);

        if (testError) {
          console.error("Test query error:", testError);
          setDatabaseError(
            `Database connection test failed: ${testError.message}`
          );
          setIsLoadingData(false);
          return;
        }

        console.log("Test query successful:", testData);

        // If we're here, tables exist, so fetch user's groups
        const { data: userGroups, error: groupsError } = await supabase
          .from("group_members")
          .select(
            `
            group_id,
            groups:group_id (
              id,
              name,
              created_at
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { foreignTable: "groups", ascending: false });

        if (groupsError) {
          console.error("Error fetching groups:", groupsError);
          setDatabaseError(
            "Error connecting to database. Please make sure your Supabase database is properly set up."
          );
          setIsLoadingData(false);
          return;
        }

        const typedGroups = (userGroups ||
          []) as unknown as SupabaseGroupResponse[];
        const fetchedGroups = typedGroups.map(ug => ({
          id: ug.groups.id,
          name: ug.groups.name,
          created_at: ug.groups.created_at
        }));
        setGroups(fetchedGroups);

        // Get the current group from URL or default to first one
        const params = new URLSearchParams(window.location.search);
        const groupId = params.get("group");
        const group = groupId
          ? fetchedGroups.find(g => g.id === groupId)
          : fetchedGroups[0];

        if (group) {
          setCurrentGroup(group);
          await fetchGroupData(group);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setDatabaseError(error.message || "An unexpected error occurred");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user, isLoading, supabase, router]);

  // Add a function to handle filtering
  const handleFilterByUser = (userId: string) => {
    if (filteredUserId === userId) {
      // If clicking the same user again, clear filter
      setFilteredUserId(null);
    } else {
      // Otherwise set the filter
      setFilteredUserId(userId);
    }
  };

  // Filter expenses based on the selected user
  const filteredExpenses = filteredUserId
    ? expenses.filter(expense => expense.paid_by === filteredUserId)
    : expenses;

  const addMember = () => {
    setMembers([...members, { name: "", email: "" }]);
  };

  const removeMember = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const updateMember = (index: number, field: string, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateGroupError(null);
    setErrorDetails(null);

    try {
      // Validate group name
      const formData = new FormData(e.target as HTMLFormElement);
      const groupName = formData.get("name") as string;

      if (!groupName || groupName.trim() === "") {
        throw new Error("Group name is required");
      }

      // Process all non-empty members - no need to filter
      const membersToAdd = members.filter(
        m => m.name.trim() !== "" || m.email.trim() !== ""
      );

      if (membersToAdd.length === 0) {
        throw new Error("At least one member is required");
      }

      // Create group in the database
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: groupName.trim(),
          created_by: user?.id // Add the current user's ID as the creator
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add current user as admin
      const { error: adminError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user?.id,
          is_admin: true
        });

      if (adminError) throw adminError;

      // Process other members
      for (const member of membersToAdd) {
        if (member.name.trim() === "" && member.email.trim() === "") {
          // Skip completely empty entries
          continue;
        }

        // Set default name/email if one is missing
        const memberName = member.name.trim() || "Unnamed";
        const memberEmail =
          member.email.trim() || `unnamed-${Date.now()}@placeholder.com`;

        // Check if user exists
        const { data: existingUser, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("email", memberEmail.toLowerCase())
          .single();

        console.log("Existing user check:", {
          memberEmail,
          existingUser,
          userError
        });

        if (existingUser && !userError) {
          // Add existing user to group
          const { error: memberError } = await supabase
            .from("group_members")
            .insert({
              group_id: group.id,
              user_id: existingUser.id,
              is_admin: false
            });

          console.log("Added existing user:", {
            existingUser,
            error: memberError
          });
        } else {
          // Invite new user with more detailed logging
          console.time(`invitedUser-${memberName}`);
          console.log("About to insert invited user:", {
            group_id: group.id,
            name: memberName,
            email: memberEmail.toLowerCase(),
            invited_by: user?.id,
            status: "pending"
          });

          try {
            // Try direct insert without selecting data back
            const { error: inviteError } = await supabase
              .from("invited_users")
              .insert({
                group_id: group.id,
                name: memberName,
                email: memberEmail.toLowerCase(),
                invited_by: user?.id,
                status: "pending"
              });

            if (inviteError) {
              console.error(
                `Error adding invited user ${memberName}:`,
                inviteError
              );
              // Continue with the group creation despite this error
            } else {
              console.log(`Successfully added invited user: ${memberName}`);
            }
          } catch (inviteErr) {
            console.error(
              `Exception when adding invited user ${memberName}:`,
              inviteErr
            );
            // Continue with the group creation despite this error
          }
          console.timeEnd(`invitedUser-${memberName}`);
        }
      }

      // Close dialog and reload groups
      setShowCreateGroupDialog(false);
      router.push(`/dashboard?group=${group.id}`);

      // Reset form
      setMembers([{ name: "", email: "" }]);

      // Reload the page to show the new group
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      console.error("Error creating group:", err);
      setCreateGroupError(`Failed to create group: ${err.message}`);
      if (err.details) {
        setErrorDetails(err.details);
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p>Loading...</p>
          {databaseError && (
            <p className="text-sm text-muted-foreground mt-2">
              {databaseError}
            </p>
          )}
        </div>
      </div>
    );
  }

  const { expensesByMember, totalExpenses } = calculateExpensesByMember(
    expenses,
    groupMembers
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-gradient-to-r from-green-50 to-blue-50">
        <div className="container flex h-14 sm:h-16 items-center justify-between py-2 sm:py-4">
          <div className="flex items-center gap-1 sm:gap-2 font-bold">
            <span className="text-lg sm:text-xl">💰 WhoPaid</span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full hidden sm:inline-block">
              Split bills, not friends.
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit">
                Log Out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-slate-50">
        <div className="container py-6">
          {databaseError && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
              <p className="font-medium">Database Error</p>
              <p className="text-sm">{databaseError}</p>
            </div>
          )}

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-500"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">
                No More "I'll Venmo You Later"
              </h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create a group in 10 seconds and start tracking who{" "}
                <i>actually</i> paid. No paywalls. No feature bloat. Just like
                it should be.
              </p>
              <GroupSelector
                userId={user?.id || ""}
                groups={[]}
                currentGroup={null}
                onGroupChange={handleGroupChange}
                onOpenChange={setIsGroupSelectorOpen}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-l-blue-500">
                <div className="flex items-center">
                  <GroupSelector
                    userId={user?.id || ""}
                    groups={groups}
                    currentGroup={currentGroup}
                    onGroupChange={handleGroupChange}
                    onOpenChange={setIsGroupSelectorOpen}
                  />
                  {currentGroup && (
                    <div className="ml-3 pl-3 border-l border-slate-200 hidden sm:block">
                      <span className="text-xs text-slate-500">
                        Current Group
                      </span>
                      <h2 className="font-semibold">{currentGroup.name}</h2>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                    onClick={() => setShowCreateGroupDialog(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span className="hidden sm:inline">New Group</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-slate-200 hover:bg-slate-50"
                  >
                    <Link
                      href={`/dashboard/settings?group=${currentGroup?.id}`}
                    >
                      <span className="hidden sm:inline-block mr-1">⚙</span>
                      <span className="hidden sm:inline">Settings</span>
                      <span className="sm:hidden">⚙</span>
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-6 md:grid-cols-8">
                <Card className="md:col-span-5 border-none shadow-md bg-gradient-to-br from-white to-blue-50 order-2 md:order-1">
                  <CardHeader className="pb-0 px-3 sm:px-4">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <CardTitle className="text-base sm:text-xl flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-blue-600"
                          >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                          Expense Report
                        </CardTitle>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                          <span>
                            {filteredUserId
                              ? `${filteredExpenses.length} of ${expenses.length} expenses`
                              : `${expenses.length} total expenses`}
                          </span>
                          {filteredUserId && (
                            <button
                              onClick={() => setFilteredUserId(null)}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <span>Clear filter</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <AddExpenseDialog
                        trigger={
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex items-center gap-1 whitespace-nowrap"
                          >
                            <PlusCircle className="h-4 w-4" />
                            <span className="hidden xs:inline">
                              Add Expense
                            </span>
                            <span className="xs:hidden">Add</span>
                          </Button>
                        }
                        groupId={currentGroup?.id}
                        groupMembers={groupMembers.map(m => ({
                          id: m.user_id,
                          name: m.user_id === user?.id ? "You" : m.users.name,
                          type: m.type,
                          email: m.users.email,
                          status: m.status
                        }))}
                        userId={user?.id || ""}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="bg-white rounded-lg overflow-hidden border">
                      {filteredUserId && (
                        <div className="bg-blue-50 px-3 py-2 rounded-md flex justify-between items-center mb-2 mx-2 mt-2">
                          <div className="text-sm">
                            <span className="font-medium">Filtered:</span>{" "}
                            Showing only expenses paid by{" "}
                            {filteredUserId === user?.id
                              ? "You"
                              : groupMembers.find(
                                  m => m.user_id === filteredUserId
                                )?.users.name || "Unknown"}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setFilteredUserId(null)}
                            className="h-7 px-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            <span className="sr-only">Clear filter</span>
                          </Button>
                        </div>
                      )}
                      <ExpenseList
                        expenses={filteredExpenses}
                        currentUserId={user?.id || ""}
                      />
                      {filteredExpenses.length === 0 && (
                        <div className="p-8 text-center">
                          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-blue-500"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium">
                            No expenses yet. Lucky you.
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Or maybe someone's freeloading? Add that
                            suspiciously overpriced boat ride.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="md:col-span-3 space-y-4 sm:space-y-6 order-1 md:order-2">
                  <Card className="border-none shadow-md bg-gradient-to-br from-white to-blue-50">
                    <CardHeader className="pb-2 px-4">
                      <div className="flex border-b">
                        <button
                          onClick={() => setActiveTab("balance")}
                          className={`px-4 py-2 font-medium text-sm flex items-center gap-1 ${
                            activeTab === "balance"
                              ? "border-b-2 border-green-500 text-green-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={
                              activeTab === "balance"
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                            <path d="m9 12 2 2 4-4"></path>
                          </svg>
                          Balance
                        </button>
                        <button
                          onClick={() => setActiveTab("summary")}
                          className={`px-4 py-2 font-medium text-sm flex items-center gap-1 ${
                            activeTab === "summary"
                              ? "border-b-2 border-blue-500 text-blue-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={
                              activeTab === "summary"
                                ? "text-blue-600"
                                : "text-muted-foreground"
                            }
                          >
                            <rect
                              x="2"
                              y="3"
                              width="20"
                              height="14"
                              rx="2"
                              ry="2"
                            ></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                          </svg>
                          Group Summary
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {activeTab === "balance" ? (
                        <div className="p-4">
                          <BalanceSummary
                            groupId={currentGroup?.id}
                            userId={user?.id || ""}
                          />
                        </div>
                      ) : (
                        <div className="p-4">
                          <CardDescription className="mb-4">
                            {currentGroup?.name}
                          </CardDescription>
                          <div className="space-y-6">
                            <div>
                              <div className="text-sm font-medium flex items-center mb-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="mr-1"
                                >
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="9" cy="7" r="4"></circle>
                                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                Members
                              </div>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {groupMembers.map(member => (
                                  <div
                                    key={member.user_id}
                                    className={`inline-flex h-8 items-center rounded-full border px-3 text-sm ${
                                      member.type === "invited"
                                        ? "border-dashed bg-muted/50"
                                        : member.user_id === user?.id
                                        ? "bg-green-100 border-green-200 text-green-800"
                                        : "bg-background"
                                    } ${
                                      member.user_id === filteredUserId
                                        ? "ring-2 ring-blue-400"
                                        : ""
                                    } cursor-pointer hover:bg-slate-50 transition-colors`}
                                    title={
                                      member.type === "invited"
                                        ? `Invited (${member.status})`
                                        : member.users.email
                                    }
                                    onClick={() =>
                                      handleFilterByUser(member.user_id)
                                    }
                                  >
                                    {member.user_id === user?.id
                                      ? "You"
                                      : member.users.name}
                                    {member.type === "invited" && " (invited)"}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md bg-gradient-to-br from-white to-indigo-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-indigo-600"
                        >
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        Expense Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {expenses.length > 0 ? (
                        <>
                          <ExpensePieChart data={expensesByMember} />

                          <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto pr-1">
                            {expensesByMember.map(member => (
                              <div
                                key={member.userId}
                                className={`flex items-center justify-between p-2 rounded-md hover:bg-slate-50 cursor-pointer ${
                                  member.userId === filteredUserId
                                    ? "bg-blue-50 border border-blue-200"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleFilterByUser(member.userId)
                                }
                              >
                                <div className="flex items-center">
                                  <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{
                                      backgroundColor: member.color
                                    }}
                                  />
                                  <span className="text-sm">
                                    {member.userId === user?.id
                                      ? "You"
                                      : member.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    ${member.total.toFixed(2)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {member.displayPercentage}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="text-xs text-muted-foreground mt-3">
                            {expenses.length === 1
                              ? "Just 1 expense so far. It begins."
                              : `${expenses.length} financial decisions, good or bad.`}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <div className="text-2xl font-bold text-green-700">
                            $0.00
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            No expenses yet. Your wallet is safe... for now.
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="border-t py-4 bg-white text-center text-sm text-muted-foreground">
        <div className="container">
          WhoPaid - Split bills, not friends. © {new Date().getFullYear()}
          <div className="text-xs mt-1">
            100% free. Like borrowing money from your good friends should be.
          </div>
        </div>
      </footer>
      <Dialog
        open={showCreateGroupDialog}
        onOpenChange={setShowCreateGroupDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleCreateGroup}>
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
              <DialogDescription>
                Track expenses, expose the freeloaders, keep your friends
                (somehow).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Summer Vacation 2025"
                  className="w-full"
                  required
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-3">
                <Label>Group Members</Label>
                {members.map((member, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Their name (or nickname if they annoy you)"
                        value={member.name}
                        onChange={e =>
                          updateMember(index, "name", e.target.value)
                        }
                        disabled={isCreating}
                      />
                      <Input
                        type="email"
                        placeholder="Their email (we promise not to spam)"
                        value={member.email}
                        onChange={e =>
                          updateMember(index, "email", e.target.value)
                        }
                        disabled={isCreating}
                      />
                    </div>
                    {members.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(index)}
                        disabled={isCreating}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={addMember}
                  disabled={isCreating}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Another Member
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  • Existing users will be added directly to the group
                  <br />• New users will receive an invitation when they sign up
                </p>
              </div>
              {createGroupError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{createGroupError}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
