"use client"

import * as React from "react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTheme } from "@/components/theme-provider"

// Import logo assets
import lightLogo from "@/assets/logo/light.png"
import darkLogo from "@/assets/logo/dark.png"
import lightThemeFull from "@/assets/logo/light_theme_full.png"
import darkThemeFull from "@/assets/logo/dark_theme_full.png"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}) {
  const { setOpenMobile, setOpen, state } = useSidebar()
  const { theme } = useTheme()
  const activeTeam = teams[0]

  if (!activeTeam) {
    return null
  }

  // Determine if we should show dark variant
  const isDark = theme === "dark" || 
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  // Select the right images based on theme
  const smallLogo = isDark ? darkLogo : lightLogo
  const fullLogo = isDark ? darkThemeFull : lightThemeFull

  const isCollapsed = state === "collapsed"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground dark:data-[state=open]:bg-sidebar-accent-foreground dark:data-[state=open]:text-sidebar-accent"
          onClick={() => {
            setOpenMobile(false)
            setOpen(false)
          }}
        >
          {isCollapsed ? (
            /* Collapsed: show only the small icon logo */
            <div className="flex aspect-square size-8 items-center justify-center">
              <img 
                src={smallLogo} 
                alt="Logo" 
                className="size-8 object-contain"
              />
            </div>
          ) : (
            /* Expanded: show small logo + full name logo */
            <>
              <div className="flex aspect-square size-8 items-center justify-center">
                <img 
                  src={smallLogo} 
                  alt="Logo" 
                  className="size-8 object-contain"
                />
              </div>
              <div className="flex-1 flex items-center">
                <img 
                  src={fullLogo} 
                  alt="Growvix" 
                  className={`h-7 object-contain ${isDark ? "mix-blend-lighten" : ""}`}
                />
              </div>
            </>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
