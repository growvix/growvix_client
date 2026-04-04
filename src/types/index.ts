// Team Member Types
export interface TeamMember {
  id: number
  name: string
  callsMade: number
  leadsConverted: number
  avgCallDuration: string
  performanceScore: number
}

// Payment/Lead Types
export interface Payment {
  id: number
  name: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}
export interface User {
  id: number
  name: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}
export interface projects {
  _id?: string
  product_id: number
  name: string
  type: string
  location: string
  property: string
  totalUnits?: number
  blockCount?: number
  bookedCount?: number
  createdAt?: string
}

// Chart Data Types
export interface ChartData {
  month: string
  desktop: number
  mobile: number
}

// Dashboard Metric Types
export interface DashboardMetric {
  id: string
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

// Daily Summary Metric Types
export interface DailySummaryMetric {
  id: string
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
}

// Stage Types
export interface Stage {
  id: number;
  name: string;
  color: string;
  nextStages: number[];
}

export interface PropertyRequirement {
  sqft?: number;
  bhk?: string[];
  floor?: string[];
  balcony?: boolean;
  bathroom_count?: number;
  parking_needed?: boolean;
  parking_count?: number;
  price_min?: number;
  price_max?: number;
  furniture?: string[];
  facing?: string[];
  plot_type?: string;
}

export interface ImportantActivity {
  activity_id: string;
  marked_at?: string;
  marked_by?: string;
}

export interface Lead {
  _id: string;
  profile_id: string;
  organization: string;
  profile: {
    name: string;
    email?: string;
    phone: string;
    location?: string;
    profileImagePath?: string;
  };
  prefered?: {
    location?: string;
    budget?: string;
  };
  pretype?: {
    type?: string;
  };
  propertyRequirement?: PropertyRequirement;
  project?: string[];
  merge_id?: string;
  acquired?: {
    campaign: string;
    source: string;
    sub_source: string;
    received: string;
    created_at: string;
    medium: string;
    _id: string;
  }[];
  stage?: string;
  status?: string;
  exe_user?: string;
  exe_user_name?: string;
  exe_user_image?: string;
  exe_user_department?: string;
  activities?: {
    id: string;
    user_id: string;
    user_name: string;
    user_image?: string;
    updates: string;
    stage: string;
    status: string;
    notes: string;
    reason: string;
    follow_up_date: string;
    site_visit_date: string;
    site_visit_completed: boolean;
    site_visit_completed_at: string;
    site_visit_completed_by: string;
    site_visit_completed_by_name: string;
    site_visit_project_id?: number;
    site_visit_project_name?: string;
    createdAt: string;
    updatedAt: string;
  }[];
  site_visits_completed?: number;
  interested_projects?: {
    project_id: number;
    project_name: string;
  }[];
  requirements?: {
    _id: string;
    key: string;
    value: string;
  }[];
  important_activities?: ImportantActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface GetLeadByIdQueryResponse {
  getLeadById: Lead;
}

export interface GetLeadByIdQueryVariables {
  organization: string;
  id: string;
}

export interface UpdateLeadInput {
  stage?: string;
  status?: string;
  exe_user?: string;
  cp_user?: string;
}

export interface UpdateLeadMutationResponse {
  updateLead: Lead;
}

export interface UpdateLeadMutationVariables {
  organization: string;
  id: string;
  input: UpdateLeadInput;
}

export interface BookedItem {
  id: string;
  label: string;
  type: string;
  bookedBy: {
    leadName?: string;
    leadUuid?: string;
    profileId?: number;
    phone?: string;
    userId?: string;
    userName?: string;
    bookedAt?: string;
  };
  project_name: string;
  project_id: number;
}

export interface ProjectSummary {
  product_id: number;
  name: string;
  location: string;
  property: string;
  img_location?: {
    logo?: string;
    banner?: string;
    brochure?: string;
    post?: string;
    videos?: string;
  };
  blockCount?: number;
  totalUnits?: number;
  bookedCount?: number;
  bookedUnits?: BookedItem[];
  createdAt?: string;
}

export interface GetAllProjectsQueryResponse {
  getAllProjects: ProjectSummary[];
}

export interface GetAllProjectsQueryVariables {
  organization: string;
}

export interface GetLeadStagesQueryResponse {
  getLeadStages: {
    stages: Stage[];
  };
}

export interface GetLeadStagesQueryVariables {
  organization: string;
}

export interface OrganizationUser {
  _id: string;
  globalUserId: string;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  role: string;
  isActive: boolean;
}

export interface GetOrganizationUsersQueryResponse {
  getOrganizationUsers: OrganizationUser[];
}

export interface GetOrganizationUsersQueryVariables {
  organization: string;
}

export interface GetProjectBookedUnitsQueryResponse {
  getProjectById: ProjectSummary;
}

export interface GetProjectBookedUnitsQueryVariables {
  organization: string;
  id: number;
}

export interface DeleteLeadMutationResponse {
  deleteLead: {
    success: boolean;
    deletedCount: number;
  };
}

export interface DeleteLeadMutationVariables {
  organization: string;
  profileId: number;
}