"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

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

export default function AddExpensePage() {
  const router = useRouter()
  const [paidByOpen, setPaidByOpen] = useState(false)
  const [paidBy, setPaidBy] = useState(members[0])
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map((member) => member.value))

  const handleMemberToggle = (value: string) => {
    setSelectedMembers((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, we would save the expense data
    router.push("/dashboard")
  }

  return (
    <div className="container max-w-md py-8">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Add Expense</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Expense Title</Label>
          <Input id="title" placeholder="e.g. That suspiciously overpriced boat ride" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input id="amount" type="number" step="0.01" placeholder="0.00" className="pl-7" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paidBy">Who Paid</Label>
          <Popover open={paidByOpen} onOpenChange={setPaidByOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={paidByOpen} className="w-full justify-between">
                {paidBy.label}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
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
        <div className="space-y-2">
          <Label>Split Between</Label>
          <div className="rounded-md border p-4">
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note (Optional)</Label>
          <Textarea id="note" placeholder="Add any details about this expense" className="resize-none" />
        </div>
        <Button type="submit" className="w-full">
          Save Expense
        </Button>
      </form>
    </div>
  )
}
