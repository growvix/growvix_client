"use client"

import * as React from "react"
import {
  Calendar,
  Package,
  GalleryVerticalEnd,
  PieChart,
  Settings,
  Users,
  LayoutDashboard,
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
    }
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Executive View",
          url: "/executive_dashboard",
          roles: ['user']
        },
        {
          title: "Master View",
          url: "/master_dashboard",
          roles: ['admin']
        },
        {
          title: "Management View",
          url: "/management_dashboard",
          roles: ['manager']
        },
      ],
    },
    {
      title: "Lead Directory",
      url: "#",
      icon: Users,
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
          title: "Project Listing",
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
      icon: PieChart,
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
  ],
  projects: [
    {
      name: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      name: "Calendar",
      url: "/user_calendar",
      icon: Calendar,
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

  const rawRole = getCookie('role') || 'user';
  const role = rawRole.toLowerCase();

  // Filter navigation items based on role
  const filteredNavMain = data.navMain.map(section => {
    if (section.title === "Dashboard") {
      return {
        ...section,
        // @ts-ignore
        items: section.items?.filter(item => item.roles?.includes(role))
      }
    }
    return section;
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
