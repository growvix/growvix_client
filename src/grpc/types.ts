// gRPC Client Types
export interface Lead {
    lead_id: BinaryType;
    profile_id: number;
    name: string;
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
    filters?: {
        name?: string;
        source?: string;
        campaign?: string;
        status?: string;
<<<<<<< HEAD
        assignedTo?: string;
        receivedOn?: string;
=======
        stage?: string;
>>>>>>> 150dd39 (grpc)
    };
}

export interface GetAllLeadsResponse {
    leads: Lead[];
}
