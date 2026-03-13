import { Link, useLocation } from "react-router-dom"
import {
  Trash2,
  type LucideIcon,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar()
  const location = useLocation()
  const pathname = location.pathname

  return (
    <SidebarGroup className="group/collapsible">
      <SidebarGroupLabel>General</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild isActive={item.url === pathname}>
              <Link 
                to={item.url}
                onClick={() => {
                  setOpen(false)
                  setOpenMobile(false)
                }}
              >
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
