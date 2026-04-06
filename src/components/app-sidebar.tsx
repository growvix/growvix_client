"use client"

import * as React from "react"
import {
  Calendar,
  Package,
  PieChart,
  Settings,
  Users,
  LayoutDashboard,
  Wrench,
  Sparkles

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
      name: "Growvix",
      logo: Package, // placeholder - TeamSwitcher uses actual image imports
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
      title: "Tools",
      url: "#",
      icon: Wrench,
      isActive: true,
      items: [
        {
          title: "Automation",
          url: "/tools/automation",
        },
        {
          title: "Third Party Integration",
          url: "/tools/third_party_integration",
        }
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: PieChart,
      isActive: true,
      items: [
        {
          title: "Reports Template",
          url: "/reports_template",
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
     {
      name: "Updates",
      url: "/updates",
      icon: Sparkles,
    },
    
    

  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: 'User',
    email: 'user@example.com',
    avatar: "/user_icon.png"
  })

  // Get user info from cookies and localStorage on mount and when profile updates
  React.useEffect(() => {
    const updateUserFromStorage = () => {
      const userName = getCookie('userName') || 'User'
      const email = getCookie('email') || 'user@example.com'
      const userId = getCookie('user_id')
      const avatar = (userId ? localStorage.getItem(`userAvatar_${userId}`) : null) || localStorage.getItem('userAvatar') || "/user_icon.png"
      
      setUser({
        name: userName,
        email: email,
        avatar: avatar,
      })
    }

    updateUserFromStorage()
    
    // Listen for custom profile update events (from ProfilePage)
    window.addEventListener('profileUpdate', updateUserFromStorage)
    
    // Also listen for storage events from other tabs
    window.addEventListener('storage', updateUserFromStorage)

    return () => {
      window.removeEventListener('profileUpdate', updateUserFromStorage)
      window.removeEventListener('storage', updateUserFromStorage)
    }
  }, [])

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
