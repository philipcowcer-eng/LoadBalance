import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8001' : '';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Check if user is authenticated on mount
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const response = await fetch(`${API_BASE}/api/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`
                        }
                    });
                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                        setToken(storedToken);
                    } else {
                        // Token invalid, clear it
                        localStorage.removeItem('token');
                        setToken(null);
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (username, password) => {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        return data.user;
    };

    const register = async (username, password, role = 'engineer') => {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    // Helper to check if user has specific role
    const hasRole = (...allowedRoles) => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    };

    // Helper to check specific permissions
    const can = (action) => {
        if (!user) return false;

        const permissions = {
            // Staff Planning
            'edit_staff_planning': ['admin', 'resource_manager'],
            'view_staff_planning': ['admin', 'resource_manager', 'project_manager', 'engineer'],
            'add_engineer': ['admin', 'resource_manager'],
            'allocate_resources': ['admin', 'resource_manager'],

            // Projects
            'edit_project_registry': ['admin', 'project_manager'],
            'view_project_registry': ['admin', 'resource_manager', 'project_manager', 'engineer'],
            'create_project': ['admin', 'resource_manager', 'project_manager', 'engineer'], // Anyone can create request
            'edit_project_status': ['admin', 'project_manager'],

            // Data
            'export_data': ['admin', 'resource_manager', 'project_manager'],
            'import_data': ['admin'], // Only admin

            // Admin
            'view_activity_log': ['admin', 'resource_manager'],
            'restore_snapshot': ['admin'],
            'manage_users': ['admin']
        };

        const allowedRoles = permissions[action];
        if (!allowedRoles) return false;
        return allowedRoles.includes(user.role);
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasRole,
        can
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
