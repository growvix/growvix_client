import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/utils/cookies';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const location = useLocation();
    const [isAuth, setIsAuth] = useState(isAuthenticated());

    // Check authentication on every route change
    useEffect(() => {
        const checkAuth = () => {
            const authStatus = isAuthenticated();
            setIsAuth(authStatus);

            // If not authenticated, we'll let the Navigate component handle redirect
            if (!authStatus) {
                console.log('User not authenticated, redirecting to login...');
            }
        };

        checkAuth();
    }, [location.pathname]); // Re-check whenever the route changes

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
