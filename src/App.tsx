/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppSidebar } from "@/components/app-sidebar"
import * as React from "react"
import { Bell, Loader2 } from 'lucide-react';
import { BreadcrumbProvider, useBreadcrumb } from "@/context/breadcrumb-context"
import { PageBreadcrumb } from "@/components/page-breadcrumb"
import { Toaster } from "@/components/ui/sonner"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Package,
  BarChart3,
  TrendingUp,
  Settings,
  Users,
  GitBranch,
  UserCog,
  Calendar,
  User,
  Hash,
  Handshake,
} from "lucide-react"
import axios from "axios"
import { getCookie } from "@/utils/cookies"
import { API_URL } from "@/config/api"
// Pages
import Dashboard from "@/pages/user_dashboard"
import AllLeads from "@/pages/lead_management/all_leads"
import Login from "@/pages/login"
import LeadDetail from "@/pages/lead_management/lead_detail"
import NewLead from "./pages/lead_management/new_lead";
import UserCalendar from "@/pages/calendar/user_calendar"
import ProfilePage from "@/pages/profile"

import ProjectListing from "./pages/inventory/project_listing";
import ProjectShowcase from "./pages/inventory/project_showcase";
import NewProject from "./pages/inventory/new_project";
import GeneralSetting from "./pages/setting/general";
import UserManagement from "./pages/setting/userManagement";
import CPManagement from "./pages/setting/cp_user/cp_management";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LeadStageSetting from "./pages/setting/leadStageSetting";
import LeadStageAnalysis from "./pages/reports/leadStage_analysis";
import GeneralReports from "./pages/reports/general_reports";
import TeamManagement from "./pages/setting/team/team_management";
import TeamDetailPage from "./pages/setting/team/team_detail";
import CpTeamManagement from "./pages/setting/cp_team/cp_team_management";
import CpTeamDetailPage from "./pages/setting/cp_team/cp_team_detail";
import ImportLeads from "./pages/setting/import_data/import_leads";

import Mail from "./pages/setting/mail";

// Searchable pages index
type SearchablePage = { label: string; url: string; group: string; icon: React.ElementType }
const SEARCHABLE_PAGES: SearchablePage[] = [
  { label: "Master View", url: "/dashboard", group: "Dashboard", icon: LayoutDashboard },
  { label: "Total Leads", url: "/all_leads", group: "Lead Directory", icon: ClipboardList },
  { label: "Add New Lead", url: "/NewLead", group: "Lead Directory", icon: PlusCircle },
  { label: "Projects", url: "/project_listing", group: "Inventory", icon: Package },
  { label: "Add Project", url: "/new_project", group: "Inventory", icon: PlusCircle },
  { label: "General Reports", url: "/general_reports", group: "Reports", icon: BarChart3 },
  { label: "Lead Stage Analysis", url: "/lead_stage_analysis", group: "Reports", icon: TrendingUp },
  { label: "General Settings", url: "/settings", group: "Settings", icon: Settings },
  { label: "Channel Partner", url: "/setting/channel_partner", group: "Settings", icon: Handshake },
  { label: "User Management", url: "/setting/user_management", group: "Settings", icon: UserCog },
  { label: "Lead Stage Setting", url: "/setting/lead_stage_setting", group: "Settings", icon: GitBranch },
  { label: "Teams", url: "/setting/teams", group: "Settings", icon: Users },
  { label: "Calendar", url: "/user_calendar", group: "Tools", icon: Calendar },
  { label: "Profile", url: "/profile", group: "Tools", icon: User },
  { label: "CP Teams", url: "/setting/cp_teams", group: "Settings", icon: Users },
];

function ScrollToTop() {
  const location = useLocation()
  
  React.useEffect(() => {
    // Scroll the window
    window.scrollTo(0, 0)
    
    // Scroll any scroll areas, like the main layout viewports
    const scrollports = document.querySelectorAll('[data-radix-scroll-area-viewport]')
    scrollports.forEach(port => port.scrollTo(0, 0))
  }, [location.pathname])

  return null
}

function SidebarLayout() {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [leadSearchLoading, setLeadSearchLoading] = React.useState(false)
  const [leadSearchResult, setLeadSearchResult] = React.useState<{ _id: string; profile_id: number; name: string } | null>(null)
  const [leadSearchError, setLeadSearchError] = React.useState(false)
  const { items: breadcrumbItems } = useBreadcrumb()
  const navigate = useNavigate()

  // Keyboard shortcut ⌘+J
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "j" || e.key === "J") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Reset search state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearchValue("")
      setLeadSearchResult(null)
      setLeadSearchError(false)
      setLeadSearchLoading(false)
    }
  }, [open])

  // Detect #profileId pattern and trigger lead search
  const profileIdMatch = searchValue.match(/^#(\d+)$/)
  const searchedProfileId = profileIdMatch ? profileIdMatch[1] : null

  React.useEffect(() => {
    if (!searchedProfileId) {
      setLeadSearchResult(null)
      setLeadSearchError(false)
      return
    }

    let cancelled = false
    const searchLead = async () => {
      setLeadSearchLoading(true)
      setLeadSearchError(false)
      setLeadSearchResult(null)

      try {
        const organization = getCookie("organization") || ""
        if (!organization) {
          setLeadSearchError(true)
          return
        }
        console.log(`${API_URL}/api/leads/search/${organization}/${searchedProfileId}`);

        const response = await axios.get(`${API_URL}/api/leads/search/${organization}/${searchedProfileId}`)
        console.log(response);

        if (cancelled) return
        if (response.status == 200) {
          setLeadSearchResult({
            _id: response.data.data._id,
            profile_id: response.data.data.profile_id,
            name: response.data.data.name || "Unknown",
          })
          console.log(response.data.data);

        } else {
          setLeadSearchError(true)

        }
      } catch {
        if (!cancelled) setLeadSearchError(true)
      } finally {
        if (!cancelled) setLeadSearchLoading(false)
        console.log(leadSearchResult);
      }
    }

    const debounce = setTimeout(searchLead, 400)
    return () => { cancelled = true; clearTimeout(debounce) }
  }, [searchedProfileId])

  // Navigate to a page and close the dialog
  const goTo = (url: string) => {
    navigate(url)
    setOpen(false)
  }

  // Group pages by section
  const pageGroups = React.useMemo(() => {
    const groups: Record<string, SearchablePage[]> = {}
    for (const page of SEARCHABLE_PAGES) {
      if (!groups[page.group]) groups[page.group] = []
      groups[page.group].push(page)
    }
    return groups
  }, [])

  return (
    <ScrollArea className="h-svh">
      <SidebarProvider >
        <AppSidebar />
        <SidebarInset >
          <header className="sticky z-5 top-0 bg-white dark:bg-black flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 mb-1">

            <PageBreadcrumb items={breadcrumbItems} />

            <div className="me-2 md:me-4 ml-auto flex gap-3">
              <Button
                variant="outline"
                className="w-[300px] bg-input/30 dark:bg-input/50 text-dark/50 hover:bg-primary-900 hover:text-gray-400 rounded-xl transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-1 focus:ring-gray-300 flex justify-between"
                onClick={() => setOpen(true)}
              >
                Search.....
                <KbdGroup>
                  <Kbd><span className="text-gray-600 dark:text-gray-500 px-1">press ⌘ + j</span></Kbd>
                </KbdGroup>
              </Button>
              <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                  placeholder="Search pages... or type #profileId"
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>
                    {searchedProfileId ? (
                      leadSearchLoading ? (
                        "Searching..."
                      ) : leadSearchResult ? (
                        <div
                          onClick={() =>
                            goTo(`/lead_detail/${leadSearchResult._id}`)
                          }
                        >
                          <span>
                            <span className="font-semibold">
                              #{leadSearchResult.profile_id}
                            </span>{" "}
                            — {leadSearchResult.name}
                          </span>
                        </div>
                      ) : (
                        "No results found."
                      )
                    ) : (
                      "No results found."
                    )}
                  </CommandEmpty>

                  {/* Profile ID search results */}
                  {searchedProfileId && (
                    <CommandGroup heading="Lead Search">
                      {leadSearchLoading && (
                        <CommandItem disabled>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Searching for lead #{searchedProfileId}...</span>
                        </CommandItem>
                      )}
                      {leadSearchResult && (
                        <CommandItem onSelect={() => goTo(`/lead_detail/${leadSearchResult.name}`)}>
                          <Hash className="mr-2 h-4 w-4" />
                          <span>
                            <span className="font-semibold">#{leadSearchResult.profile_id}</span>
                            {" — "}
                            {leadSearchResult.name}
                          </span>
                        </CommandItem>
                      )}

                    </CommandGroup>
                  )}

                  {/* Page navigation groups */}
                  {!searchedProfileId && Object.entries(pageGroups).map(([group, pages]) => (
                    <CommandGroup key={group} heading={group}>
                      {pages.map((page) => (
                        <CommandItem key={page.url} onSelect={() => goTo(page.url)}>
                          <page.icon className="mr-2 h-4 w-4" />
                          <span>{page.label}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </CommandDialog>


            
              <ModeToggle />
            </div>
          </header>

          {/* Render nested app routes here */}
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </ScrollArea>
  )
}

export default function App() {
  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme="system">
      <BreadcrumbProvider>
        <ScrollToTop />
        <Toaster position="top-center" />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/all_leads" element={<AllLeads />} />
            <Route path="/NewLead" element={<NewLead />} />

            <Route path="/user_calendar" element={<UserCalendar />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/lead_detail/:id" element={<LeadDetail />} />
            <Route path="/project_listing" element={<ProjectListing />} />
            <Route path="/project_showcase" element={<ProjectShowcase />} />
            <Route path="/new_project" element={<NewProject />} />
            <Route path="/settings" element={<GeneralSetting />} />
            <Route path="/setting/user_management" element={<UserManagement />} />
            <Route path="/setting/lead_stage_setting" element={<LeadStageSetting />} />
            {/* <Route path="/reports/lead_stage_analysis" element={<LeadStageAnalysis />} /> */}

            <Route path="/general_reports" element={<GeneralReports />} />
            <Route path="/lead_stage_analysis" element={<LeadStageAnalysis />} />

            <Route path="/setting/teams" element={<TeamManagement />} />
            <Route path="/setting/teams/:id" element={<TeamDetailPage />} />
            <Route path="/setting/cp_teams" element={<CpTeamManagement />} />
            <Route path="/setting/cp_teams/:id" element={<CpTeamDetailPage />} />
            <Route path="/setting/channel_partner" element={<CPManagement />} />
            <Route path="/setting/import_leads" element={<ImportLeads />} />
            <Route path="/setting/mail" element={<Mail/>} />

          </Route>
        </Routes>
      </BreadcrumbProvider>
    </ThemeProvider>
  )
}
