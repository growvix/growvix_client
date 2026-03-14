import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  function toggleTheme() {
    // Determine the current effective theme
    let effectiveTheme = theme
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }

    // Toggle to the opposite of the effective theme
    setTheme(effectiveTheme === "dark" ? "light" : "dark")
  }

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)

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