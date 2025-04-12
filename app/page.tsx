import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2 font-bold">
          <span className="text-xl">WhoPaid</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-6 py-24 text-center md:py-32">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Who <span className="text-primary">Paid</span> for that?
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              WhoPaid is free. Like it should be. Start splitting in 10 seconds.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Link href="/sign-up">
              <Button size="lg" className="gap-1.5">
                Create a Group
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
        <section className="container py-12 md:py-24">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 shadow">
              <h3 className="text-xl font-bold">Effortless to use</h3>
              <p className="text-muted-foreground">No feature bloat. Just the essentials for tracking who paid what.</p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow">
              <h3 className="text-xl font-bold">Private & secure</h3>
              <p className="text-muted-foreground">
                Your financial data stays between you and your friends. That's it.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow">
              <h3 className="text-xl font-bold">Free without limits</h3>
              <p className="text-muted-foreground">No paywalls. No "premium" features. Everything's included.</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            Built with a touch of rebellion and zero corporate nonsense.
          </p>
        </div>
      </footer>
    </div>
  )
}
