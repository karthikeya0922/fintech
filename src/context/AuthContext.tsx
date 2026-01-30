import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, SignupData, LoginData, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
    login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
    signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = 'visnova_users';
const CURRENT_USER_KEY = 'visnova_currentUser';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

// Get stored users
const getStoredUsers = (): Record<string, User & { password: string }> => {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : {};
};

// Save users to storage
const saveUsers = (users: Record<string, User & { password: string }>) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Get current user from storage
const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
};

// Save current user to storage
const saveCurrentUser = (user: User | null) => {
    if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(CURRENT_USER_KEY);
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    // Check for existing session on mount
    useEffect(() => {
        const user = getCurrentUser();
        setState({
            user,
            isAuthenticated: !!user,
            isLoading: false,
        });
    }, []);

    const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
        const users = getStoredUsers();

        // Check if email already exists
        if (users[data.email]) {
            return { success: false, error: 'An account with this email already exists' };
        }

        // Create new user
        const newUser: User & { password: string } = {
            id: generateId(),
            name: data.name,
            email: data.email,
            password: data.password, // In production, this should be hashed
            createdAt: new Date().toISOString(),
        };

        // Save to storage
        users[data.email] = newUser;
        saveUsers(users);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = newUser;
        saveCurrentUser(userWithoutPassword);

        setState({
            user: userWithoutPassword,
            isAuthenticated: true,
            isLoading: false,
        });

        return { success: true };
    };

    const login = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
        const users = getStoredUsers();
        const user = users[data.email];

        if (!user) {
            return { success: false, error: 'No account found with this email' };
        }

        if (user.password !== data.password) {
            return { success: false, error: 'Incorrect password' };
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user;
        saveCurrentUser(userWithoutPassword);

        setState({
            user: userWithoutPassword,
            isAuthenticated: true,
            isLoading: false,
        });

        return { success: true };
    };

    const logout = () => {
        saveCurrentUser(null);
        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });
    };

    return (
        <AuthContext.Provider value={{ ...state, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
