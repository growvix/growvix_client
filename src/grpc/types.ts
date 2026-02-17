// gRPC Client Types
export interface Lead {
    lead_id: BinaryType;
    profile_id: number;
    name: string;
    campaign: string;
    source: string;
    sub_source: string;
    received: string;
}

export interface GetAllLeadsRequest {
    organization: string;
    filters?: {
        name?: string;
        source?: string;
        campaign?: string;
        status?: string;
    };
}

export interface GetAllLeadsResponse {
    leads: Lead[];
}
