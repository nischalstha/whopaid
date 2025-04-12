"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createGroup } from "@/app/actions/groups";
import { useToast } from "@/hooks/use-toast";

type Group = {
  id: string;
  name: string;
  created_at: string;
};

interface MemberInput {
  name: string;
  email: string;
}

interface GroupSelectorProps {
  userId: string;
  groups: Group[];
  currentGroup: Group | null;
  onGroupChange: (group: Group) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function GroupSelector({
  userId,
  groups = [],
  currentGroup,
  onGroupChange,
  onOpenChange
}: GroupSelectorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [showNewGroupDialog, setShowNewGroupDialog] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [errorDetails, setErrorDetails] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<MemberInput[]>([
    { name: "", email: "" }
  ]);

  const addMember = () => {
    setMembers([...members, { name: "", email: "" }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (
    index: number,
    field: keyof MemberInput,
    value: string
  ) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    setErrorDetails(null);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set(
        "members",
        JSON.stringify(members.filter(m => m.email.trim()))
      );

      console.log("Creating group with data:", {
        name: formData.get("name"),
        members: members.filter(m => m.email.trim())
      });

      const result = await createGroup(formData);
      console.log("Create group result:", result);

      if (result.error) {
        setError(result.error);
        setErrorDetails(result.details || null);
        toast({
          title: "Error creating group",
          description: result.error,
          variant: "destructive"
        });
        return;
      }

      if (result.success) {
        const addedCount = result.summary?.added || 0;
        const invitedCount = result.summary?.invited || 0;

        let description = "Group created successfully.";
        if (addedCount > 0 || invitedCount > 0) {
          const parts = [];
          if (addedCount > 0) {
            parts.push(
              `${addedCount} existing member${
                addedCount !== 1 ? "s" : ""
              } added`
            );
          }
          if (invitedCount > 0) {
            parts.push(
              `${invitedCount} invitation${invitedCount !== 1 ? "s" : ""} sent`
            );
          }
          description = `Group created with ${parts.join(" and ")}.`;
        }

        toast({
          title: "Group created successfully!",
          description
        });

        setShowNewGroupDialog(false);

        // More aggressive refresh approach
        router.refresh();

        // Wait slightly for server-side data to update
        setTimeout(() => {
          if (result.groupId) {
            // Force reload to ensure all data is up to date
            window.location.href = `/dashboard?group=${result.groupId}`;
          } else {
            window.location.reload();
          }
        }, 500);
      }
    } catch (error: any) {
      console.error("Error creating group:", error);
      setError(error.message || "An unexpected error occurred");
      toast({
        title: "Error creating group",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`justify-between min-w-[200px] bg-white hover:bg-slate-50 ${
              currentGroup ? "border-blue-300 shadow-sm" : "border-slate-200"
            }`}
          >
            <div className="flex items-center">
              <div className="mr-2 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <span className="font-medium">
                {currentGroup?.name || "Pick your money pit"}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search groups..." />
            <CommandList>
              <CommandEmpty>No group found.</CommandEmpty>
              <CommandGroup heading="Your Groups">
                {groups.map(group => (
                  <CommandItem
                    key={group.id}
                    value={group.id}
                    onSelect={() => {
                      onOpenChange(false);
                      if (group.id !== currentGroup?.id) {
                        onGroupChange(group);

                        // Update URL with the group ID
                        const url = new URL(window.location.href);
                        url.searchParams.set("group", group.id);
                        window.history.pushState({}, "", url);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <div
                        className={`mr-2 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 ${
                          currentGroup?.id === group.id
                            ? "ring-2 ring-blue-400"
                            : ""
                        }`}
                      >
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{group.name}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        currentGroup?.id === group.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
