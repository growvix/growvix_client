/**
 * API Configuration
 * Centralized API URL configuration from environment variables
 */

// Get API URL from environment, fallback to localhost for development
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API endpoints
export const API = {
    AUTH: {
        LOGIN: `${API_URL}/api/auth/login`,
        REGISTER: `${API_URL}/api/auth/register`,
        LOGOUT: `${API_URL}/api/auth/logout`,
    },
    USERS: `${API_URL}/api/users`,
    PROJECTS: `${API_URL}/api/projects`,
    LEADS: `${API_URL}/api/leads`,

    // Project specific endpoints
    getProject: (id: number | string) => `${API_URL}/api/projects/${id}`,
    getProjectBlocks: (id: number | string) => `${API_URL}/api/projects/${id}/blocks`,
    updateProject: (id: number | string) => `${API_URL}/api/projects/${id}`,

    // Upload endpoints
    UPLOAD: {
        FLOOR_PLANS: `${API_URL}/api/upload/floor-plans`,
    },
};

export default API;
