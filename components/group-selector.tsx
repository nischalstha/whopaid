"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

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

type Group = {
  value: string
  label: string
}

const groups: Group[] = [
  {
    value: "iceland-2025",
    label: "Iceland 2025",
  },
  {
    value: "apartment",
    label: "Apartment",
  },
  {
    value: "road-trip",
    label: "Road Trip",
  },
]

export function GroupSelector() {
  const [open, setOpen] = React.useState(false)
  const [showNewGroupDialog, setShowNewGroupDialog] = React.useState(false)
  const [selectedGroup, setSelectedGroup] = React.useState<Group>(groups[0])

  return (
    <>
      <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Select a group"
              className="w-[200px] justify-between"
            >
              {selectedGroup.label}
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
                      key={group.value}
                      value={group.value}
                      onSelect={() => {
                        setSelectedGroup(group)
                        setOpen(false)
                      }}
                    >
                      {group.label}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedGroup.value === group.value ? "opacity-100" : "opacity-0",
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>Add a new group to track expenses with friends.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input id="name" placeholder="e.g., Summer Vacation 2025" className="w-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="members">Add Members (emails, separated by comma)</Label>
              <Input id="members" placeholder="friend@example.com, another@example.com" className="w-full" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNewGroupDialog(false)} className="w-full">
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
