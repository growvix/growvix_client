import React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  // Treat anything that's exactly 'dark' as dark. If your provider uses other values adapt accordingly.
  const isDark = theme === "dark"

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-pressed={isDark}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative"
    >
      <Sun
        className={
          "h-[1.2rem] w-[1.2rem] transition-all " +
          (isDark ? "opacity-0 scale-75 rotate-0" : "opacity-100 scale-100 rotate-0")
        }
      />
      <Moon
        className={
          "absolute h-[1.2rem] w-[1.2rem] transition-all " +
          (isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 rotate-0")
        }
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}