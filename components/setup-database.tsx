"use client"

import { useState } from "react"
import { AlertCircle, Check, Copy, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export function SetupDatabase() {
  const { toast } = useToast()
  const [isExecuting, setIsExecuting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [setupSql, setSetupSql] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("auto")

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message])
  }

  const fetchSetupSql = async () => {
    try {
      const response = await fetch("/api/setup-functions")
      const sql = await response.text()
      setSetupSql(sql)
    } catch (error: any) {
      console.error("Error fetching SQL:", error)
      setError(error.message || "Failed to fetch SQL script")
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(setupSql)
    toast({
      title: "Copied to clipboard",
      description: "SQL script has been copied to your clipboard",
    })
  }

  const executeSetupScript = async () => {
    setIsExecuting(true)
    setError(null)
    addLog("Starting database setup...")

    try {
      // Execute the SQL script
      const response = await fetch("/api/setup-database", {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to set up database")
      }

      if (result.logs) {
        result.logs.forEach((log: string) => addLog(log))
      }

      addLog("Database setup completed successfully!")
      setIsComplete(true)
    } catch (error: any) {
      console.error("Error setting up database:", error)
      setError(error.message || "An unexpected error occurred")
      addLog(`Error: ${error.message || "An unexpected error occurred"}`)

      // If we get an error, fetch the SQL script for manual setup
      if (!setupSql) {
        await fetchSetupSql()
        setActiveTab("manual")
      }
    } finally {
      setIsExecuting(false)
    }
  }

  // Fetch the SQL script when the component mounts
  useState(() => {
    fetchSetupSql()
  })

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Database Setup Required</CardTitle>
        <CardDescription>Your database tables need to be created before you can use the application.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto">Automatic Setup</TabsTrigger>
            <TabsTrigger value="manual">Manual Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">What will happen:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create tables for users, groups, expenses, and splits</li>
                <li>Set up Row Level Security (RLS) policies</li>
                <li>Create functions for calculating balances</li>
                <li>Set up triggers for user creation</li>
              </ul>
            </div>

            {logs.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Setup Log:</h3>
                <div className="bg-muted p-3 rounded-md h-48 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono mb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={executeSetupScript} disabled={isExecuting || isComplete} className="w-full">
              {isExecuting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Up Database...
                </>
              ) : isComplete ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Setup Complete - Refresh Page
                </>
              ) : (
                "Set Up Database"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Manual Setup Instructions:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Go to your{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Supabase Dashboard
                  </a>
                </li>
                <li>Select your project</li>
                <li>Go to the SQL Editor</li>
                <li>Create a new query</li>
                <li>Copy and paste the SQL below</li>
                <li>Run the query</li>
                <li>Return to this page and refresh</li>
              </ol>
            </div>

            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy SQL</span>
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded-md h-64 overflow-auto text-xs">
                {setupSql || "Loading SQL script..."}
              </pre>
            </div>

            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page After Setup
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
