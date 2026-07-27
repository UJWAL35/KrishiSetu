import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";
import { AUTH_KEY } from "@/pages/Login";

type UseAuthOptions = {
    redirectOnUnauthenticated?: boolean;
    redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
    const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
        options ?? {};

    const navigate = useNavigate();

    // Read the authenticated role from localStorage (set on successful login)
    const role = localStorage.getItem(AUTH_KEY);

    // Build a minimal user-like object from the stored role so the rest of the
    // UI (avatar initials, displayed name, etc.) keeps working without a backend call.
    const user = role
        ? { name: role.charAt(0).toUpperCase() + role.slice(1), role }
        : null;

    const isLoading = false;
    const error = null;

    // Logout: clear localStorage and navigate to login immediately — no backend
    // call needed because our auth is purely localStorage-based.
    const logout = useCallback(() => {
        localStorage.removeItem(AUTH_KEY);
        navigate(redirectPath, { replace: true });
    }, [navigate, redirectPath]);

    useEffect(() => {
        if (redirectOnUnauthenticated && !user) {
            const currentPath = window.location.pathname;
            if (currentPath !== redirectPath) {
                navigate(redirectPath, { replace: true });
            }
        }
    }, [redirectOnUnauthenticated, user, navigate, redirectPath]);

    return useMemo(
        () => ({
            user,
            isAuthenticated: !!user,
            isLoading,
            error,
            logout,
            refresh: () => {},
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [role, logout],
    );
}
