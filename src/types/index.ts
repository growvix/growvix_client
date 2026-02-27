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

export interface Lead {
  _id: string;
  profile_id: string;
  organization: string;
  profile: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  prefered?: {
    location: string;
    budget: string;
  };
  pretype?: {
    type: string;
  };
  bathroom?: string;
  parking?: string;
  project?: string;
  floor?: string;
  facing?: string;
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
  activities?: {
    id: string;
    user_id: string;
    user_name: string;
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
    createdAt: string;
    updatedAt: string;
  }[];
  site_visits_completed?: number;
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
}

export interface UpdateLeadMutationResponse {
  updateLead: Lead;
}

export interface UpdateLeadMutationVariables {
  organization: string;
  id: string;
  input: UpdateLeadInput;
}