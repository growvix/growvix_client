// gRPC Lead Client
import { API_URL } from '@/config/api';
import type { Lead, GetAllLeadsRequest, GetAllLeadsResponse } from './types';

const GRPC_BASE_URL = `${API_URL}/grpc`;

/**
 * Fetch leads with pagination using gRPC/Connect protocol
 */
export async function getAllLeads(request: GetAllLeadsRequest): Promise<{ leads: Lead[]; total: number }> {
    const response = await fetch(`${GRPC_BASE_URL}/lead/GetAllLeads`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch leads' }));
        throw new Error(error.error || 'Failed to fetch leads');
    }

    const data: GetAllLeadsResponse = await response.json();
    return { leads: data.leads, total: data.total };
}

// Export a client object for consistent API
export const leadClient = {
    getAllLeads,
};
