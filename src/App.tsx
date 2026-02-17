import { AppSidebar } from "@/components/app-sidebar"
import * as React from "react"
import { Bell } from 'lucide-react';
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
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react"
// Pages
import Dashboard from "@/pages/user_dashboard"
import AllLeads from "@/pages/lead_management/all_leads"
import Login from "@/pages/login"
import LeadDetail from "@/pages/lead_management/lead_detail"
import NewLead from "./pages/lead_management/new_lead";
import UserCalendar from "@/pages/calendar/user_calendar"
import ProfilePage from "@/pages/profile"
import CallWindow from "@/components/call-window"
import ProjectListing from "./pages/inventory/project_listing";
import ProjectShowcase from "./pages/inventory/project_showcase";
import NewProject from "./pages/inventory/new_project";
import GeneralSetting from "./pages/setting/general";
import UserManagement from "./pages/setting/userManagement";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LeadStageSetting from "./pages/setting/leadStageSetting";

function SidebarLayout() {
  const [open, setOpen] = React.useState(false)
  const [isOnline, setIsOnline] = React.useState(true)
  const { items: breadcrumbItems } = useBreadcrumb()
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
                className="w-[300px] bg-white  text-dark/50 hover:bg-primary-900 hover:text-gray-400 rounded-xl transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-1 focus:ring-gray-300 flex justify-between"
                onClick={() => setOpen(true)}
              >
                Search.....
                <KbdGroup>
                  <Kbd><span className="text-gray-600 dark:text-gray-500 px-1">press ⌘ + j</span></Kbd>
                </KbdGroup>
              </Button>
              <CommandDialog open={open} onOpenChange={setOpen}>
                {/* ...existing command content... */}
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    <CommandItem>
                      <Calendar />
                      <span>Calendar</span>
                    </CommandItem>
                    <CommandItem>
                      <Smile />
                      <span>Search Emoji</span>
                    </CommandItem>
                    <CommandItem>
                      <Calculator />
                      <span>Calculator</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Settings">
                    <CommandItem>
                      <User />
                      <span>Profile</span>
                      <CommandShortcut>⌘P</CommandShortcut>
                    </CommandItem>
                    <CommandItem>
                      <CreditCard />
                      <span>Billing</span>
                      <CommandShortcut>⌘B</CommandShortcut>
                    </CommandItem>
                    <CommandItem>
                      <Settings />
                      <span>Settings</span>
                      <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </CommandDialog>

              <Select value={isOnline ? "online" : "offline"} onValueChange={(value: any) => setIsOnline(value === "online")}>
                <SelectTrigger className="relative z-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="online">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                        online
                      </span>
                    </SelectItem>
                    <SelectItem value="offline">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                        offline
                      </span>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
              <ModeToggle />
            </div>
          </header>

          {/* Render nested app routes here */}
          <Outlet />
        </SidebarInset>
        {/* Offline overlay - mutes and disables entire app except status selector */}
        {!isOnline && (
          <div className="fixed inset-0 bg-black/50 dark:bg-white/10 z-40 cursor-not-allowed" />
        )}
      </SidebarProvider>
    </ScrollArea>
  )
}

export default function App() {
  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme="system">
      <BreadcrumbProvider>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/ivr-call" element={<CallWindow />} />
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

          </Route>
        </Routes>
      </BreadcrumbProvider>
    </ThemeProvider>
  )
}
