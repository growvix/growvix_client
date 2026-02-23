// Cookie utility functions

export const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
};

export const setCookie = (name: string, value: string, maxAge: number = 86400) => {
    // Using root path (/) to make cookies accessible across all routes
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

export const deleteCookie = (name: string) => {
    // Delete cookie by setting max-age to 0 with root path
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
};

export const deleteAllAuthCookies = () => {
    deleteCookie('profile_id');
    deleteCookie('organization');
    deleteCookie('userName');
    deleteCookie('email');
    deleteCookie('token');
    deleteCookie('role');
    deleteCookie('permissions');
};

export const isAuthenticated = (): boolean => {
    const token = getCookie('token');
    const profileId = getCookie('profile_id');
    return !!(token && profileId);
};

export const getPermissions = (): string[] => {
    try {
        const raw = getCookie('permissions');
        return raw ? JSON.parse(decodeURIComponent(raw)) : [];
    } catch {
        return [];
    }
};
