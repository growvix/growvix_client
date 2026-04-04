/**
 * API Configuration
 * Centralized API URL configuration from environment variables
 */

// Get API URL from environment, fallback to localhost for development
export const API_URL = import.meta.env.VITE_API_URL || 'http://[IP_ADDRESS]';

export const getSanitizedAvatarUrl = (url: string | null | undefined): string => {
    if (!url || url === "/user_icon.png") return "/user_icon.png";
    if (url.includes('/uploads/')) {
        const path = url.substring(url.indexOf('/uploads/'));
        return `${API_URL}${path}`;
    }
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${API_URL}/${cleanUrl}`;
};

// API endpoints
export const API = {
    AUTH: {
        LOGIN: `${API_URL}/api/auth/login`,
        REGISTER: `${API_URL}/api/auth/register`,
        LOGOUT: `${API_URL}/api/auth/logout`,
        IMPERSONATE: `${API_URL}/api/auth/impersonate`,
        CP_LOGIN: `${API_URL}/api/auth/Cplogin`,
        ENCRYPTION_KEY: `${API_URL}/api/auth/encryption-key`,
    },
    USERS: `${API_URL}/api/users`,

    // Projects (Inventory)
    PROJECTS: `${API_URL}/api/projects`,
    LEADS: `${API_URL}/api/leads`,
    TEAMS: `${API_URL}/api/teams`,
    CAMPAIGNS: `${API_URL}/api/campaigns`,
    SOURCES: `${API_URL}/api/sources`,
    LEAD_CAPTURE_CONFIGS: `${API_URL}/api/lead-capture-configs`,

    // Project specific endpoints
    getProject: (id: number | string) => `${API_URL}/api/projects/${id}`,
    getProjectBlocks: (id: number | string) => `${API_URL}/api/projects/${id}/blocks`,
    updateProject: (id: number | string) => `${API_URL}/api/projects/${id}`,
    bookUnit: (projectId: number | string) => `${API_URL}/api/projects/${projectId}/book`,
    reverseBook: (projectId: number | string) => `${API_URL}/api/projects/${projectId}/reverse-book`,
    getProjectBookedUnits: (projectId: number | string) => `${API_URL}/api/projects/${projectId}/booked`,
    getAllBookedUnits: () => `${API_URL}/api/projects/booked/all`,

    // User specific endpoints
    getUser: (id: string) => `${API_URL}/api/users/${id}`,
    updateUser: (id: string) => `${API_URL}/api/users/${id}`,
    deleteUser: (id: string) => `${API_URL}/api/users/${id}`,

    // Team specific endpoints
    getTeam: (id: string) => `${API_URL}/api/teams/${id}`,
    getTeamMembers: (id: string) => `${API_URL}/api/teams/${id}/members`,
    removeTeamMember: (teamId: string, userId: string) => `${API_URL}/api/teams/${teamId}/members/${userId}`,
    getTeamUsers: () => `${API_URL}/api/teams/users`,

    // CP User endpoints
    CP_USERS: `${API_URL}/api/cp-users`,

    getCpUser: (id: string) => `${API_URL}/api/cp-users/${id}`,
    updateCpUser: (id: string) => `${API_URL}/api/cp-users/${id}`,
    deleteCpUser: (id: string) => `${API_URL}/api/cp-users/${id}`,
    updateCpUserProjects: (id: string) => `${API_URL}/api/cp-users/${id}/projects`,

    // CP Team endpoints
    CP_TEAMS: `${API_URL}/api/cp-teams`,

    getCpTeam: (id: string) => `${API_URL}/api/cp-teams/${id}`,
    getCpTeamMembers: (id: string) => `${API_URL}/api/cp-teams/${id}/members`,
    removeCpTeamMember: (teamId: string, userId: string) => `${API_URL}/api/cp-teams/${teamId}/members/${userId}`,
    getCpTeamUsers: () => `${API_URL}/api/cp-teams/users`,

    // Upload endpoints
    UPLOAD: {
        FLOOR_PLANS: `${API_URL}/api/upload/floor-plans`,
        PROFILE_PICTURE: `${API_URL}/api/upload/profile-picture`,
    },
    MAIL: `${API_URL}/api/mail`,
    MAIL_TEMPLATES: `${API_URL}/api/mail/templates`,
    getMailTemplate: (id: string) => `${API_URL}/api/mail/templates/${id}`,
};

export default API;
