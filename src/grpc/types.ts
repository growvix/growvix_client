// gRPC Client Types
export interface Lead {
    lead_id: BinaryType;
    profile_id: number;
    name: string;
    phone: string;
    email: string;
    stage: string;
    status: string;
    campaign: string;
    source: string;
    sub_source: string;
    received: string;
    exe_user: string;
    exe_user_name: string;
    is_secondary?: boolean;
    merged_into?: any;
}

export interface GetAllLeadsRequest {
    organization: string;
    offset?: number;
    limit?: number;
    filters?: {
        name?: string;
        source?: string;
        campaign?: string;
        sub_source?: string;
        status?: string;
        stage?: string;
        assignedTo?: string;
        receivedOn?: string;
    };
}

export interface GetAllLeadsResponse {
    leads: Lead[];
    total: number;
}
