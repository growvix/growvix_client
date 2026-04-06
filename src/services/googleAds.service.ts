import axios from 'axios';
import { getCookie } from '@/utils/cookies';
import { API_URL } from '@/config/api';

const getOrganization = () => getCookie('organization') || '';

export const googleAdsService = {
    createIntegration: async (data: any) => {
        const response = await axios.post(
            `${API_URL}/api/google-ads-integration?organization=${getOrganization()}`,
            data
        );
        return response.data;
    },

    getIntegrations: async () => {
        const response = await axios.get(
            `${API_URL}/api/google-ads-integration?organization=${getOrganization()}`
        );
        return response.data;
    },

    getIntegrationById: async (id: string) => {
        const response = await axios.get(
            `${API_URL}/api/google-ads-integration/${id}?organization=${getOrganization()

            }`
        );
        return response.data;
    },

    updateIntegration: async (id: string, data: any) => {
        const response = await axios.put(
            `${API_URL}/api/google-ads-integration/${id}?organization=${getOrganization()}`,
            data
        );
        return response.data;
    },

    deleteIntegration: async (id: string) => {
        const response = await axios.delete(
            `${API_URL}/api/google-ads-integration/${id}?organization=${getOrganization()}`
        );
        return response.data;
    },

    // Test data & mapping
    getTestData: async (id: string) => {
        const response = await axios.get(
            `${API_URL}/api/google-ads-integration/${id}/test-data?organization=${getOrganization()}`
        );
        return response.data;
    },

    saveMapping: async (id: string, fieldMapping: any[]) => {
        const response = await axios.put(
            `${API_URL}/api/google-ads-integration/${id}/mapping?organization=${getOrganization()}`,
            { field_mapping: fieldMapping }
        );
        return response.data;
    },

    // Helpers to fetch campaigns, sources and projects for selection
    getCampaigns: async () => {
        const response = await axios.get(
            `${API_URL}/api/campaigns?organization=${getOrganization()}`
        );
        return response.data;
    },

    getSources: async () => {
        const response = await axios.get(
            `${API_URL}/api/sources?organization=${getOrganization()}`
        );
        return response.data;
    },

    getProjects: async () => {
        const response = await axios.get(
            `${API_URL}/api/projects?organization=${getOrganization()}`
        );
        return response.data;
    }
};
