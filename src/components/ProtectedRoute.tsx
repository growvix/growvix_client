import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { isAuthenticated, getCookie } from '@/utils/cookies';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    blockCpFromApp?: boolean;
}

export const ProtectedRoute = ({ children, allowedRoles, blockCpFromApp }: ProtectedRouteProps) => {
    const location = useLocation();
    const [isAuth, setIsAuth] = useState(isAuthenticated());
    const role = getCookie('role')?.toLowerCase() || '';

    // Check authentication on every route change
    useEffect(() => {
        const checkAuth = () => {
            const authStatus = isAuthenticated();
            setIsAuth(authStatus);
        };
        checkAuth();
    }, [location.pathname]);

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    if (blockCpFromApp && (role === 'cp' || role === 'channel_partner' || role === 'cp_user')) {
        return <Navigate to="/cp/dashboard" replace />;
    }

    return <>{children}</>;
};
