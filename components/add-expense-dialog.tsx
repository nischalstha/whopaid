"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useRouter } from "next/navigation"

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
import { addExpense } from "@/app/actions/expenses"
import { useToast } from "@/hooks/use-toast"

type Member = {
  id: string
  name: string
}

export function AddExpenseDialog({
  trigger,
  groupId,
  groupMembers = [],
  userId,
}: {
  trigger: React.ReactNode
  groupId?: string
  groupMembers: Member[]
  userId: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [paidByOpen, setPaidByOpen] = React.useState(false)
  const [paidBy, setPaidBy] = React.useState<Member | null>(groupMembers.find((m) => m.id === userId) || null)
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>(groupMembers.map((member) => member.id))
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleMemberToggle = (value: string) => {
    setSelectedMembers((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!groupId || !paidBy) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)

      // Add the group ID
      formData.append("groupId", groupId)

      // Add the paid by user ID
      formData.append("paidBy", paidBy.id)

      // Add the split between user IDs
      selectedMembers.forEach((memberId) => {
        formData.append("splitBetween", memberId)
      })

      const result = await addExpense(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Expense added!",
        description: "Your expense has been added successfully.",
      })

      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error adding expense",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Enter the details of the expense to split with your group.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Expense Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. That suspiciously overpriced boat ride"
                className="w-full"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paidBy">Who Paid</Label>
              <Popover open={paidByOpen} onOpenChange={setPaidByOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={paidByOpen} className="justify-between">
                    {paidBy?.name || "Select person"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search person..." />
                    <CommandList>
                      <CommandEmpty>No person found.</CommandEmpty>
                      <CommandGroup>
                        {groupMembers.map((member) => (
                          <CommandItem
                            key={member.id}
                            value={member.id}
                            onSelect={() => {
                              setPaidBy(member)
                              setPaidByOpen(false)
                            }}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4", paidBy?.id === member.id ? "opacity-100" : "opacity-0")}
                            />
                            {member.name}
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
                {groupMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => handleMemberToggle(member.id)}
                    />
                    <Label htmlFor={`member-${member.id}`} className="text-sm font-normal">
                      {member.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                name="note"
                placeholder="Add any details about this expense"
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !paidBy || selectedMembers.length === 0}>
              {isSubmitting ? "Saving..." : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
