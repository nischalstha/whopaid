"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/database.types";

// Helper function to get Supabase client with proper cookie handling
async function getSupabaseClient() {
  const cookieStore = cookies();
  return createServerActionClient<Database>({ cookies: () => cookieStore });
}

export async function createGroup(formData: FormData) {
  try {
    // Initialize Supabase client with proper async handling
    const supabase = await getSupabaseClient();

    // Validate session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return { error: `Authentication error: ${sessionError.message}` };
    }

    if (!session) {
      return { error: "Not authenticated. Please sign in again." };
    }

    // Get form data
    const name = formData.get("name") as string;
    const membersInput = formData.get("members") as string;

    if (!name) {
      return { error: "Group name is required" };
    }

    // Parse members JSON
    let members = [];
    try {
      members = JSON.parse(membersInput || "[]");
    } catch (e) {
      return { error: "Invalid members data" };
    }

    console.log("Creating group:", name, "for user:", session.user.id);

    // First, let's check if we can query the database at all
    const { data: testData, error: testError } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (testError) {
      console.error("Test query error:", testError);
      return {
        error: `Database connection test failed: ${
          testError.message || "Unknown error"
        }`,
        details: JSON.stringify(testError)
      };
    }

    // Try a simpler insert approach
    const groupData = {
      name,
      created_by: session.user.id
    };

    console.log("Inserting group with data:", groupData);

    // Create the group - using a simpler approach first
    const { data: insertedGroup, error: insertError } = await supabase
      .from("groups")
      .insert(groupData)
      .select();

    if (insertError) {
      console.error("Error inserting group:", insertError);
      return {
        error: `Database error creating group: ${
          insertError.message || "Unknown error"
        }`,
        details: JSON.stringify(insertError),
        code: insertError.code
      };
    }

    if (!insertedGroup || insertedGroup.length === 0) {
      return {
        error: "Failed to create group: No data returned",
        details: "The insert operation succeeded but no data was returned"
      };
    }

    const group = insertedGroup[0];
    console.log("Group created:", group);

    // Add the creator as an admin member
    const memberData = {
      group_id: group.id,
      user_id: session.user.id,
      is_admin: true
    };

    console.log("Adding creator as member with data:", memberData);

    const { error: memberError } = await supabase
      .from("group_members")
      .insert(memberData);

    if (memberError) {
      console.error("Error adding creator as member:", memberError);
      return {
        error: `Error adding you as a member: ${
          memberError.message || "Unknown error"
        }`,
        details: JSON.stringify(memberError),
        code: memberError.code
      };
    }

    console.log("Creator added as admin member");

    // Add other members if provided
    const memberResults = [];
    if (members.length > 0) {
      console.log("Processing members:", members);

      for (const member of members) {
        const email = member.email.trim().toLowerCase();
        const memberName = member.name.trim() || email.split("@")[0];

        if (!email) continue;

        // Skip creator's email if included
        if (email === session.user.email?.toLowerCase()) {
          console.log(`Skipping creator's email: ${email}`);
          memberResults.push({
            email,
            name: memberName,
            status: "skipped",
            message: "Creator already added to group"
          });
          continue;
        }

        try {
          // Check if user exists
          let { data: existingUser, error: userError } = await supabase
            .from("users")
            .select("id, email, name")
            .eq("email", email)
            .single();

          if (userError && userError.code === "PGRST116") {
            // User not found - add to invited_users table instead
            console.log(
              `User ${email} not found, adding to invited_users table`
            );

            // Generate a UUID for the invited user
            const invitedUserData = {
              name: memberName,
              email: email,
              invited_by: session.user.id,
              group_id: group.id,
              status: "pending"
            };

            console.log("Inserting invited user with data:", invitedUserData);

            const { data: invitedUser, error: inviteError } = await supabase
              .from("invited_users")
              .insert(invitedUserData)
              .select();

            if (inviteError) {
              console.error(
                `Error creating invitation for ${email}:`,
                inviteError
              );
              console.error("Error details:", JSON.stringify(inviteError));
              memberResults.push({
                email,
                name: memberName,
                status: "error",
                error: `Invitation failed: ${
                  inviteError.message || "Unknown error"
                }`
              });
              continue;
            }

            console.log(
              `Successfully created invitation for ${email}:`,
              invitedUser
            );
            memberResults.push({
              email,
              name: memberName,
              status: "invited",
              message: "Invitation created"
            });

            // Skip adding to group_members since they're not a registered user yet
            continue;
          } else if (userError) {
            console.error(`Error checking user ${email}:`, userError);
            memberResults.push({
              email,
              name: memberName,
              status: "error",
              error: userError.message
            });
            continue;
          }

          // Now add them to the group
          const { error: addMemberError } = await supabase
            .from("group_members")
            .insert({
              group_id: group.id,
              user_id: existingUser.id,
              is_admin: false
            });

          if (addMemberError) {
            console.error(
              `Error adding member ${existingUser.id} to group:`,
              addMemberError
            );
            memberResults.push({
              email,
              name: existingUser.name,
              status: "error",
              error: addMemberError.message
            });
          } else {
            memberResults.push({
              email,
              name: existingUser.name,
              status: "added",
              message: existingUser.id
                ? "Added existing user to group"
                : "Created new user and added to group"
            });
          }
        } catch (memberError: any) {
          console.error(`Error processing member ${email}:`, memberError);
          memberResults.push({
            email,
            name: memberName,
            status: "error",
            error: memberError.message || "Unknown error"
          });
        }
      }
    }

    // Log final results with names
    console.log(
      "Member addition results:",
      memberResults.map(r => ({
        email: r.email,
        name: r.name,
        status: r.status,
        message: r.message || r.error
      }))
    );

    const addedCount = memberResults.filter(r => r.status === "added").length;
    const invitedCount = memberResults.filter(
      r => r.status === "invited"
    ).length;

    revalidatePath("/dashboard");
    return {
      success: true,
      groupId: group.id,
      memberResults,
      summary: {
        added: addedCount,
        invited: invitedCount,
        total: addedCount + invitedCount
      }
    };
  } catch (error: any) {
    console.error("Unexpected error creating group:", error);
    return {
      error: `Unexpected error: ${error.message || "Unknown error"}`,
      details: error.stack || JSON.stringify(error)
    };
  }
}

export async function getGroupWithMembers(groupId: string) {
  try {
    // Initialize Supabase client with proper async handling
    const supabase = await getSupabaseClient();

    // Validate session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return { error: `Authentication error: ${sessionError.message}` };
    }

    if (!session) {
      return { error: "Not authenticated. Please sign in again." };
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError) {
      console.error("Error fetching group:", groupError);
      return { error: groupError.message };
    }

    // Get regular members with user details
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select(
        `
        id,
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
      return { error: membersError.message };
    }

    // Get invited users
    const { data: invitedUsers, error: invitedError } = await supabase
      .from("invited_users")
      .select("*")
      .eq("group_id", groupId);

    if (invitedError) {
      console.error("Error fetching invited users:", invitedError);
      return { error: invitedError.message };
    }

    // Format regular members
    const formattedMembers = members.map(member => ({
      id: member.users.id,
      name: member.users.name,
      email: member.users.email,
      is_admin: member.is_admin,
      status: "registered",
      type: "registered"
    }));

    // Format invited users
    const formattedInvited = invitedUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: false,
      status: user.status,
      type: "invited",
      invited_by: user.invited_by
    }));

    // Combine all members
    const allMembers = [...formattedMembers, ...formattedInvited];

    return {
      success: true,
      group: {
        ...group,
        members: allMembers
      }
    };
  } catch (error: any) {
    console.error("Error fetching group with members:", error);
    return {
      error: `Unexpected error: ${error.message || "Unknown error"}`,
      details: error.stack || JSON.stringify(error)
    };
  }
}

export async function updateGroupName(groupId: string, newName: string) {
  try {
    // Initialize Supabase client with proper async handling
    const supabase = await getSupabaseClient();

    // Validate session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { error: "Authentication required" };
    }

    // Check if user is admin of this group
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("is_admin")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single();

    if (membershipError || !membership || !membership.is_admin) {
      return { error: "You don't have permission to update this group" };
    }

    // Update group name
    const { error: updateError } = await supabase
      .from("groups")
      .update({ name: newName })
      .eq("id", groupId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating group:", error);
    return { error: error.message || "Failed to update group" };
  }
}

export async function removeGroupMember(groupId: string, userId: string) {
  try {
    // Initialize Supabase client with proper async handling
    const supabase = await getSupabaseClient();

    // Validate session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { error: "Authentication required" };
    }

    // Check if user is admin of this group
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("is_admin")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single();

    if (membershipError || !membership || !membership.is_admin) {
      return { error: "You don't have permission to remove members" };
    }

    // Prevent removing yourself
    if (userId === session.user.id) {
      return { error: "You cannot remove yourself from the group" };
    }

    // Remove member from group
    const { error: removeError } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (removeError) {
      return { error: removeError.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error: any) {
    console.error("Error removing member:", error);
    return { error: error.message || "Failed to remove member" };
  }
}

export async function removeInvitedUser(
  groupId: string,
  invitedUserId: string
) {
  try {
    // Initialize Supabase client with proper async handling
    const supabase = await getSupabaseClient();

    // Validate session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { error: "Authentication required" };
    }

    // Check if user is admin of this group
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("is_admin")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single();

    if (membershipError || !membership || !membership.is_admin) {
      return { error: "You don't have permission to remove invitations" };
    }

    // Remove invited user
    const { error: removeError } = await supabase
      .from("invited_users")
      .delete()
      .eq("group_id", groupId)
      .eq("id", invitedUserId);

    if (removeError) {
      return { error: removeError.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error: any) {
    console.error("Error removing invitation:", error);
    return { error: error.message || "Failed to remove invitation" };
  }
}

export async function deleteGroup(groupId: string) {
  try {
    // Initialize Supabase client with proper async handling
    const supabase = await getSupabaseClient();

    // Validate session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { error: "Authentication required" };
    }

    // Check if user is admin and creator of this group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("created_by")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return { error: "Group not found" };
    }

    if (group.created_by !== session.user.id) {
      return { error: "Only the group creator can delete the group" };
    }

    // Delete group and all related data (using cascading deletes)
    const { error: deleteError } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (deleteError) {
      return { error: deleteError.message };
    }

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting group:", error);
    return { error: error.message || "Failed to delete group" };
  }
}

export async function getGroupMembers(groupId: string) {
  try {
    // Initialize Supabase client with proper async handling
    const supabase = await getSupabaseClient();

    // Validate session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { error: "Authentication required" };
    }

    // Get regular members
    const { data: members, error: membersError } = await supabase
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
      return { error: membersError.message };
    }

    // Get invited users
    const { data: invitedUsers, error: invitedError } = await supabase
      .from("invited_users")
      .select("*")
      .eq("group_id", groupId);

    if (invitedError) {
      return { error: invitedError.message };
    }

    return {
      success: true,
      members: members.map(m => ({
        id: m.user_id,
        name: m.users.name,
        email: m.users.email,
        isAdmin: m.is_admin,
        type: "registered"
      })),
      invitedUsers: invitedUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        type: "invited"
      }))
    };
  } catch (error: any) {
    console.error("Error fetching members:", error);
    return { error: error.message || "Failed to fetch members" };
  }
}

export async function getGroupDetails(groupId: string) {
  try {
    // Initialize Supabase client with proper async handling
    const supabase = await getSupabaseClient();

    // Validate session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { error: "Authentication required" };
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError) {
      return { error: groupError.message };
    }

    // Get current user's membership details
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("is_admin")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single();

    if (membershipError) {
      return { error: membershipError.message };
    }

    return {
      success: true,
      group,
      isAdmin: membership.is_admin,
      isCreator: group.created_by === session.user.id
    };
  } catch (error: any) {
    console.error("Error fetching group details:", error);
    return { error: error.message || "Failed to fetch group details" };
  }
}
