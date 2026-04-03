
import * as React from "react"
import { BreadcrumbProvider } from "@/context/breadcrumb-context"
import { getCookie } from '@/utils/cookies';
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
import CampaignLevelReport from "./pages/reports/campaign_level_report";
import SourceLevelReport from "./pages/reports/source_level_report";
import SubSourceLevelReport from "./pages/reports/subSource_level_report";
import ProjectLevelReport from "./pages/reports/project_level_report";
import TeamManagement from "./pages/setting/team/team_management";
import TeamDetailPage from "./pages/setting/team/team_detail";
import CpTeamManagement from "./pages/setting/cp_team/cp_team_management";
import CpTeamDetailPage from "./pages/setting/cp_team/cp_team_detail";
import ImportLeads from "./pages/setting/import_data/import_leads";
import NewLeadUpload from "./pages/setting/import_data/new_lead_upload";
import CpLoginPage from "./pages/cp/cp_login";
import CpLayout from "./pages/cp/cp_layout";
import CpDashboard from "./pages/cp/cp_dashboard";
import CpProjectShowcase from "./pages/cp/cp_project_showcase";
import EditProject from "./pages/inventory/edit_project";

import Mail from "./pages/setting/mail";
import MailTemplatesListing from "./pages/setting/mail_templates/mail_listing";
import CreateTemplate from "./pages/setting/mail_templates/create_template";
import Automation from "./pages/tools/automation";
import Campaigns from "./pages/tools/campaigns";
import ThirdPartyIntegration from "./pages/tools/third_party_integration";
import TrackSourceSubsource from "./pages/tools/track_source_subsource";

import GoogleAdsIntegrationList from "./pages/tools/google_ads_integration_list";
import GoogleAdsIntegrationTest from "./pages/tools/google_ads_integration_test";

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

const RoleBasedRedirect = () => {
  const role = getCookie('role');
  if (role === 'admin') return <Navigate to="/master_dashboard" replace />;
  if (role === 'manager') return <Navigate to="/management_dashboard" replace />;
  if (role === 'cp' || role === 'channel_partner' || role === 'cp_user') return <Navigate to="/cp/dashboard" replace />;
  return <Navigate to="/executive_dashboard" replace />;
};

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
          <Route element={<ProtectedRoute allowedRoles={['cp', 'channel_partner', 'cp_user']}><CpLayout /></ProtectedRoute>}>
            <Route path="/cp/dashboard" element={<CpDashboard />} />
            <Route path="/cp/project" element={<CpProjectShowcase />} />
          </Route>
          <Route element={<ProtectedRoute blockCpFromApp><SidebarLayout /></ProtectedRoute>}>
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="/executive_dashboard" element={<Dashboard />} />
            <Route path="/master_dashboard" element={<ProtectedRoute allowedRoles={['admin']}><MasterDashboard /></ProtectedRoute>} />
            <Route path="/management_dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><ManagementDashboard /></ProtectedRoute>} />
            <Route path="/admin_dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />

            <Route path="/all_leads" element={<AllLeads />} />
            <Route path="/NewLead" element={<NewLead />} />

            <Route path="/user_calendar" element={<UserCalendar />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/lead_detail/:id" element={<LeadDetail />} />
            <Route path="/project_listing" element={<ProjectListing />} />
            <Route path="/project_showcase" element={<ProjectShowcase />} />
            <Route path="/new_project" element={<NewProject />} />
            <Route path="/edit_project/:id" element={<EditProject />} />
            <Route path="tools/automation" element={<Automation />} />
            <Route path="automation/campaigns" element={<Campaigns />} />
            <Route path="automation/track_source_subsource" element={<TrackSourceSubsource />} />
            <Route path="/settings" element={<GeneralSetting />} />
            <Route path="/setting/user_management" element={<UserManagement />} />
            <Route path="/setting/lead_stage_setting" element={<LeadStageSetting />} />
            {/* <Route path="/reports/lead_stage_analysis" element={<LeadStageAnalysis />} /> */}
            <Route path="/reports_template" element={<GeneralReports />} />
            <Route path="/reports/campaign_level_report" element={<CampaignLevelReport />} />
            <Route path="/reports/source_level_report" element={<SourceLevelReport />} />
            <Route path="/reports/sub_source_level_report" element={<SubSourceLevelReport />} />


            <Route path="/reports/project_level_report" element={<ProjectLevelReport />} />
            {/* <Route path="/general_reports" element={<GeneralReports />} /> */}
            <Route path="/lead_stage_analysis" element={<LeadStageAnalysis />} />

            <Route path="/setting/teams" element={<TeamManagement />} />
            <Route path="/setting/teams/:id" element={<TeamDetailPage />} />
            <Route path="/setting/cp_teams" element={<CpTeamManagement />} />
            <Route path="/setting/cp_teams/:id" element={<CpTeamDetailPage />} />
            <Route path="/setting/channel_partner" element={<CPManagement />} />
            <Route path="/setting/import_leads" element={<ImportLeads />} />
            <Route path="/setting/import_leads/new" element={<NewLeadUpload />} />
            <Route path="/setting/mail" element={<Mail />} />
            <Route path="/automation/mail_templates" element={<MailTemplatesListing />} />
            <Route path="/automation/mail_templates/create" element={<CreateTemplate />} />
            <Route path="/automation/mail_templates/edit/:id" element={<CreateTemplate />} />
            <Route path="/tools/third_party_integration" element={<ThirdPartyIntegration />} />
            <Route path="/tools/third_party_integration/google_ads" element={<GoogleAdsIntegrationList />} />
            <Route path="/tools/third_party_integration/google_ads/test/:id" element={<GoogleAdsIntegrationTest />} />

          </Route>
        </Routes>
      </BreadcrumbProvider>
    </ThemeProvider>
  )
}
