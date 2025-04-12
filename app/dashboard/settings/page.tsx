"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, UserPlus } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const groupId = searchParams.get("group");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  const [originalGroupName, setOriginalGroupName] = useState("");
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // Client-side data fetching to avoid server action issues
  useEffect(() => {
    console.log("Settings page mounted, groupId:", groupId);
    addToDebugLog(`Settings page mounted, groupId: ${groupId}`);

    if (!groupId) {
      console.error("No group ID provided");
      addToDebugLog("No group ID provided");
      setError("No group ID provided. Please select a group first.");
      setIsLoading(false);
      return;
    }

    if (!user) {
      console.log("No user found, waiting for auth...");
      addToDebugLog("No user found, waiting for auth...");
      return;
    }

    const fetchDataDirectly = async () => {
      setIsLoading(true);
      addToDebugLog("Starting data fetch...");

      try {
        const supabase = createClientComponentClient();

        // Get group details
        const { data: group, error: groupError } = await supabase
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single();

        if (groupError) {
          console.error("Error fetching group:", groupError);
          addToDebugLog(`Error fetching group: ${groupError.message}`);
          throw new Error(groupError.message);
        }

        addToDebugLog(`Group data fetched: ${group.name}`);
        setGroupName(group.name);
        setOriginalGroupName(group.name);

        // Check user membership
        const { data: membership, error: membershipError } = await supabase
          .from("group_members")
          .select("is_admin")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .single();

        if (membershipError) {
          console.error("Error fetching membership:", membershipError);
          addToDebugLog(
            `Error fetching membership: ${membershipError.message}`
          );
          throw new Error("You are not a member of this group.");
        }

        addToDebugLog(
          `Membership data fetched, isAdmin: ${membership.is_admin}`
        );
        setIsAdmin(membership.is_admin);
        setIsCreator(group.created_by === user.id);

        // Get regular members
        const { data: membersData, error: membersError } = await supabase
          .from("group_members")
          .select(
            `
            id,
            user_id,
            is_admin,
            users:user_id (
              id,
              name,
              email
            )
          `
          )
          .eq("group_id", groupId);

        if (membersError) {
          console.error("Error fetching members:", membersError);
          addToDebugLog(`Error fetching members: ${membersError.message}`);
          throw new Error(membersError.message);
        }

        addToDebugLog(`Members fetched: ${membersData.length}`);

        // Get invited users
        const { data: invitedData, error: invitedError } = await supabase
          .from("invited_users")
          .select("*")
          .eq("group_id", groupId);

        if (invitedError) {
          console.error("Error fetching invited users:", invitedError);
          addToDebugLog(
            `Error fetching invited users: ${invitedError.message}`
          );
          throw new Error(invitedError.message);
        }

        addToDebugLog(`Invited users fetched: ${invitedData.length}`);

        // Process and set data
        const processedMembers = membersData.map(m => ({
          id: m.user_id,
          name: m.users.name,
          email: m.users.email,
          isAdmin: m.is_admin,
          type: "registered"
        }));

        const processedInvited = invitedData.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          status: u.status,
          type: "invited"
        }));

        setMembers(processedMembers);
        setInvitedUsers(processedInvited);
        addToDebugLog("All data processed successfully");
      } catch (error: any) {
        console.error("Error loading group data:", error);
        addToDebugLog(`Error: ${error.message}`);
        setError(error.message || "Failed to load group data");
      } finally {
        setIsLoading(false);
        addToDebugLog("Loading complete");
      }
    };

    fetchDataDirectly();
  }, [groupId, user]);

  function addToDebugLog(message: string) {
    setDebugLog(prev => [
      ...prev,
      `${new Date().toISOString().split("T")[1].split(".")[0]}: ${message}`
    ]);
  }

  const handleUpdateGroupName = async () => {
    if (!groupId || groupName === originalGroupName) return;

    setIsSaving(true);
    addToDebugLog("Updating group name...");

    try {
      const supabase = createClientComponentClient();

      // First check permissions
      const { data: membership, error: membershipError } = await supabase
        .from("group_members")
        .select("is_admin")
        .eq("group_id", groupId)
        .eq("user_id", user?.id)
        .single();

      if (membershipError || !membership || !membership.is_admin) {
        throw new Error("You don't have permission to update this group");
      }

      // Update group name
      const { error: updateError } = await supabase
        .from("groups")
        .update({ name: groupName })
        .eq("id", groupId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setOriginalGroupName(groupName);
      addToDebugLog("Group name updated successfully");

      toast({
        title: "Group updated",
        description: "Group name has been updated successfully."
      });
    } catch (error: any) {
      console.error("Error updating group:", error);
      addToDebugLog(`Error updating group: ${error.message}`);
      toast({
        title: "Error",
        description: error.message || "Failed to update group",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId || !isAdmin) return;

    addToDebugLog(`Removing member: ${memberId}`);

    try {
      const supabase = createClientComponentClient();

      // Remove member from group
      const { error: removeError } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", memberId);

      if (removeError) {
        throw new Error(removeError.message);
      }

      // Update local state
      setMembers(members.filter(m => m.id !== memberId));
      addToDebugLog("Member removed successfully");

      toast({
        title: "Member removed",
        description: "Group member has been removed successfully."
      });
    } catch (error: any) {
      console.error("Error removing member:", error);
      addToDebugLog(`Error removing member: ${error.message}`);
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const handleRemoveInvitedUser = async (invitedUserId: string) => {
    if (!groupId || !isAdmin) return;

    addToDebugLog(`Removing invited user: ${invitedUserId}`);

    try {
      const supabase = createClientComponentClient();

      // Remove invited user
      const { error: removeError } = await supabase
        .from("invited_users")
        .delete()
        .eq("group_id", groupId)
        .eq("id", invitedUserId);

      if (removeError) {
        throw new Error(removeError.message);
      }

      // Update local state
      setInvitedUsers(invitedUsers.filter(u => u.id !== invitedUserId));
      addToDebugLog("Invitation removed successfully");

      toast({
        title: "Invitation removed",
        description: "Invitation has been removed successfully."
      });
    } catch (error: any) {
      console.error("Error removing invitation:", error);
      addToDebugLog(`Error removing invitation: ${error.message}`);
      toast({
        title: "Error",
        description: error.message || "Failed to remove invitation",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId || !isCreator) return;

    setIsDeleting(true);
    addToDebugLog("Deleting group...");

    try {
      const supabase = createClientComponentClient();

      // Check if user is creator
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("created_by")
        .eq("id", groupId)
        .single();

      if (groupError || !group) {
        throw new Error("Group not found");
      }

      if (group.created_by !== user?.id) {
        throw new Error("Only the group creator can delete the group");
      }

      // Delete group
      const { error: deleteError } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      addToDebugLog("Group deleted successfully");

      toast({
        title: "Group deleted",
        description: "Group has been deleted successfully."
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error deleting group:", error);
      addToDebugLog(`Error deleting group: ${error.message}`);
      toast({
        title: "Error",
        description: error.message || "Failed to delete group",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p>Loading group settings...</p>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>Group ID: {groupId || "None"}</p>
            <p>User ID: {user?.id || "Not authenticated"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href={`/dashboard?group=${groupId}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
          <h1 className="text-xl font-bold">Group Control Room</h1>
        </div>
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Group Identity Crisis</CardTitle>
            <CardDescription>
              Change your group's name if it's having an identity crisis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                disabled={!isAdmin || isSaving}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleUpdateGroupName}
              disabled={
                !isAdmin ||
                isSaving ||
                groupName === originalGroupName ||
                !groupName.trim()
              }
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>The Usual Suspects</CardTitle>
              <CardDescription>Your fellow money-spenders</CardDescription>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" className="ml-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Recruit More Victims
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between"
                >
                <div>
                    <p className="font-medium">
                      {member.id === user?.id ? "You" : member.name}
                      {member.isAdmin && " (Admin)"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                </div>
                  {isAdmin && member.id !== user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                  Remove
                </Button>
                  )}
                </div>
              ))}

              {invitedUsers.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Invited Members
                  </h3>
                  {invitedUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {user.name}{" "}
                          <span className="text-xs text-muted-foreground">
                            (Invited)
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email} • {user.status}
                        </p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveInvitedUser(user.id)}
                        >
                          Cancel
                </Button>
                      )}
              </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails when expenses are added
                </p>
              </div>
              <Switch id="email-notifications" defaultChecked disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              Email notifications are coming soon.
            </p>
          </CardContent>
        </Card>

        {isCreator && (
        <Card className="border-destructive">
          <CardHeader>
              <CardTitle className="text-destructive">Nuclear Option</CardTitle>
              <CardDescription>
                Press the big red button. We dare you.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                    Delete This Expense Hell
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                    <DialogTitle>Woah, Slow Down There</DialogTitle>
                  <DialogDescription>
                      This will permanently delete your group and all expense
                      history. Your friends might actually miss you in their
                      debt collection list.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={isDeleting}
                    >
                    Cancel
                  </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteGroup}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Yes, delete group"}
                    </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Debug panel that shows the log */}
        <Card className="border-dashed border-muted">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="max-h-32 overflow-auto">
            <div className="text-xs font-mono">
              <div>GroupID: {groupId}</div>
              <div>UserID: {user?.id}</div>
              <div>Is admin: {isAdmin ? "Yes" : "No"}</div>
              <div>Is creator: {isCreator ? "Yes" : "No"}</div>
              <div className="mt-2 border-t pt-2">
                {debugLog.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
