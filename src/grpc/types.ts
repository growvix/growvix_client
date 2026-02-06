// gRPC Client Types
export interface Lead {
    profileId: number;
    name: string;
    campaign: string;
    source: string;
    subSource: string;
    received: string;
}

export interface GetAllLeadsRequest {
    organization: string;
}

export interface GetAllLeadsResponse {
    leads: Lead[];
}
