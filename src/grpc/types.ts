// gRPC Client Types
export interface Lead {
    lead_id: BinaryType;
    profile_id: number;
    name: string;
    phone: string;
    stage: string;
    status: string;
    campaign: string;
    source: string;
    sub_source: string;
    received: string;
    exe_user: string;
    exe_user_name: string;
}

export interface GetAllLeadsRequest {
    organization: string;
    offset?: number;
    limit?: number;
    filters?: {
        name?: string;
        source?: string;
        campaign?: string;
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
