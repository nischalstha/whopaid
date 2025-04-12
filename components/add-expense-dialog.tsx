"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

const members = [
  {
    value: "you",
    label: "You",
  },
  {
    value: "alex",
    label: "Alex",
  },
  {
    value: "priya",
    label: "Priya",
  },
  {
    value: "jordan",
    label: "Jordan",
  },
]

export function AddExpenseDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [paidByOpen, setPaidByOpen] = React.useState(false)
  const [paidBy, setPaidBy] = React.useState(members[0])
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>(members.map((member) => member.value))

  const handleMemberToggle = (value: string) => {
    setSelectedMembers((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Enter the details of the expense to split with your group.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Expense Title</Label>
            <Input id="title" placeholder="e.g. That suspiciously overpriced boat ride" className="w-full" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input id="amount" type="number" placeholder="0.00" className="pl-7" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paidBy">Who Paid</Label>
            <Popover open={paidByOpen} onOpenChange={setPaidByOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={paidByOpen} className="justify-between">
                  {paidBy.label}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search person..." />
                  <CommandList>
                    <CommandEmpty>No person found.</CommandEmpty>
                    <CommandGroup>
                      {members.map((member) => (
                        <CommandItem
                          key={member.value}
                          value={member.value}
                          onSelect={() => {
                            setPaidBy(member)
                            setPaidByOpen(false)
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", paidBy.value === member.value ? "opacity-100" : "opacity-0")}
                          />
                          {member.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label>Split Between</Label>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`member-${member.value}`}
                    checked={selectedMembers.includes(member.value)}
                    onCheckedChange={() => handleMemberToggle(member.value)}
                  />
                  <Label htmlFor={`member-${member.value}`} className="text-sm font-normal">
                    {member.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea id="note" placeholder="Add any details about this expense" className="resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={() => setOpen(false)}>
            Save Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
