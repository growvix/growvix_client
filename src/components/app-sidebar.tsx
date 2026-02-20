"use client"

import * as React from "react"
import {
  AudioWaveform,
  Calendar,
  Command,
  Package,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  ClipboardList,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { getCookie } from "@/utils/cookies"
const organization = getCookie('organization') || 'org'

// Static navigation data
const data = {
  teams: [
    {
      name: "DESK CRM",
      logo: GalleryVerticalEnd,
      plan: organization.toUpperCase(),
    },
    {
      name: "DESK CRM",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Master View",
          url: "/dashboard",
        },
        {
          title: "Customized View",
          url: "#",
        },
      ],
    },
    {
      title: "Lead Directory",
      url: "#",
      icon: ClipboardList,
      isActive: true,
      items: [
        {
          title: "Total Leads",
          url: "/all_leads",
        },
        {
          title: "Add New Lead",
          url: "/NewLead",
        },
      ],
    },
    {
      title: "Inventory",
      url: "#",
      icon: Package,
      isActive: true,
      items: [
        {
          title: "Projects",
          url: "/project_listing",
        },
        {
          title: "Add Project",
          url: "/new_project",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: Package,
      isActive: true,
      items: [
        {
          title: "General Reports",
          url: "/general_reports",
        },
        {
          title: "Lead Stage Analysis",
          url: "/lead_stage_analysis",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      isActive: true,
      items: [
        {
          title: "General",
          url: "/settings",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Calendar",
      url: "/user_calendar",
      icon: Calendar,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Get user info from cookies
  const userName = getCookie('userName') || 'User'
  const email = getCookie('email') || 'user@example.com'


  const user = {
    name: userName,
    email: email,
    avatar: "/user_icon.png",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
