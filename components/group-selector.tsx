"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createGroup } from "@/app/actions/groups"
import { useToast } from "@/hooks/use-toast"

type Group = {
  id: string
  name: string
}

export function GroupSelector({ userId, groups = [] }: { userId: string; groups: Group[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [showNewGroupDialog, setShowNewGroupDialog] = React.useState(false)
  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(groups[0] || null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [errorDetails, setErrorDetails] = React.useState<string | null>(null)

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)
    setErrorDetails(null)

    try {
      const formData = new FormData(e.currentTarget)
      console.log("Submitting form data:", Object.fromEntries(formData.entries()))

      const result = await createGroup(formData)
      console.log("Create group result:", result)

      if (result.error) {
        setError(result.error)
        setErrorDetails(result.details || null)
        throw new Error(result.error)
      }

      toast({
        title: "Group created!",
        description: "Your new group has been created successfully.",
      })

      setShowNewGroupDialog(false)
      router.refresh()
    } catch (error: any) {
      console.error("Error in handleCreateGroup:", error)

      // If we haven't already set an error from the result
      if (!error) {
        setError(`Failed to create group: ${error.message || "Unknown error"}`)
      }

      toast({
        title: "Error creating group",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
        {groups.length > 0 ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-label="Select a group"
                className="w-[200px] justify-between"
              >
                {selectedGroup?.name || "Select group"}
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandList>
                  <CommandInput placeholder="Search group..." />
                  <CommandEmpty>No group found.</CommandEmpty>
                  <CommandGroup heading="Your Groups">
                    {groups.map((group) => (
                      <CommandItem
                        key={group.id}
                        value={group.id}
                        onSelect={() => {
                          setSelectedGroup(group)
                          setOpen(false)
                          // In a real app, you'd update the URL or state to show this group
                          router.push(`/dashboard?group=${group.id}`)
                        }}
                      >
                        {group.name}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedGroup?.id === group.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <DialogTrigger asChild>
                      <CommandItem
                        onSelect={() => {
                          setOpen(false)
                          setShowNewGroupDialog(true)
                        }}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Group
                      </CommandItem>
                    </DialogTrigger>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
        )}
        <DialogContent>
          <form onSubmit={handleCreateGroup}>
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
              <DialogDescription>Add a new group to track expenses with friends.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input id="name" name="name" placeholder="e.g., Summer Vacation 2025" className="w-full" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="members">Add Members (emails, separated by comma)</Label>
                <Input
                  id="members"
                  name="members"
                  placeholder="friend@example.com, another@example.com"
                  className="w-full"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error}
                    {errorDetails && (
                      <details className="mt-2 text-xs">
                        <summary>Technical details</summary>
                        <pre className="mt-2 w-full overflow-auto text-xs">{errorDetails}</pre>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
