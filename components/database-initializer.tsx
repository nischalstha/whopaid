"use client"

import { useEffect, useState } from "react"

export function DatabaseInitializer() {
  const [initialized, setInitialized] = useState(false)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    const checkAndInitDatabase = async () => {
      try {
        // First check if the database is already set up
        const checkResponse = await fetch("/api/check-database")
        const checkData = await checkResponse.json()

        if (checkData.ready) {
          console.log("Database is already set up")
          setInitialized(true)
          return
        }

        // If not ready, initialize the database
        console.log("Database needs initialization, attempting...")
        const initResponse = await fetch("/api/init-database")
        const initData = await initResponse.json()

        console.log("Database initialization attempt:", initData)

        // Check again after initialization
        const recheckResponse = await fetch("/api/check-database")
        const recheckData = await recheckResponse.json()

        if (recheckData.ready) {
          console.log("Database is now ready")
          setInitialized(true)
        } else {
          console.log("Database still not ready after initialization attempt")
          // Try again if we haven't made too many attempts
          if (attempts < 3) {
            setAttempts((prev) => prev + 1)
          } else {
            console.error("Failed to initialize database after multiple attempts")
            setInitialized(true) // Stop trying
          }
        }
      } catch (error) {
        console.error("Failed to initialize database:", error)
        // Try again if we haven't made too many attempts
        if (attempts < 3) {
          setAttempts((prev) => prev + 1)
        } else {
          setInitialized(true) // Stop trying
        }
      }
    }

    if (!initialized) {
      checkAndInitDatabase()
    }
  }, [initialized, attempts])

  // This component doesn't render anything
  return null
}
