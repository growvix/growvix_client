/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react"
import { BreadcrumbProvider } from "@/context/breadcrumb-context"
import { Toaster } from "@/components/ui/sonner"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import SidebarLayout from "./pages/layout"
// Pages
import Dashboard from "@/pages/dashboard/executive_dashboard"
import MasterDashboard from "@/pages/dashboard/masterView_dashboard"
import ManagementDashboard from "@/pages/dashboard/management_dashboard"
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
import CpLoginPage from "./pages/cp/cp_login";
import CpLayout from "./pages/cp/cp_layout";
import CpDashboard from "./pages/cp/cp_dashboard";

import Mail from "./pages/setting/mail";

// Searchable pages index
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

export default function App() {
  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme="system">
      <BreadcrumbProvider>
        <ScrollToTop />
        <Toaster position="top-center" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cp/login" element={<CpLoginPage />} />

          {/* CP Routes — no sidebar */}
          <Route element={<ProtectedRoute><CpLayout /></ProtectedRoute>}>
            <Route path="/cp/dashboard" element={<CpDashboard />} />
            <Route path="/cp/project" element={<ProjectShowcase />} />
          </Route>
          <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/executive_dashboard" replace />} />
            <Route path="/executive_dashboard" element={<Dashboard />} />
            <Route path="/master_dashboard" element={<MasterDashboard />} />
            <Route path="/management_dashboard" element={<ManagementDashboard />} />
            <Route path="/admin_dashboard" element={<Dashboard />} />

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
            <Route path="/setting/mail" element={<Mail />} />

          </Route>
        </Routes>
      </BreadcrumbProvider>
    </ThemeProvider>
  )
}
