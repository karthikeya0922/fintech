import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the shape of our user profile
export interface UserProfile {
    name: string;
    email: string;
    income: number;
    expenses: number;
    savingsGoal: number; // Percentage
    portfolioValue: number;
    theme: 'light' | 'dark';
    currency: string;
}

// Default values for new users
const defaultProfile: UserProfile = {
    name: 'User',
    email: 'user@example.com',
    income: 85000,
    expenses: 45000,
    savingsGoal: 20,
    portfolioValue: 245000,
    theme: 'dark',
    currency: 'INR'
};

interface UserProfileContextType {
    profile: UserProfile;
    updateProfile: (updates: Partial<UserProfile>) => void;
    toggleTheme: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize state from localStorage or defaults
    const [profile, setProfile] = useState<UserProfile>(() => {
        const saved = localStorage.getItem('finova_user_profile');
        return saved ? JSON.parse(saved) : defaultProfile;
    });

    // Persist changes to localStorage
    useEffect(() => {
        localStorage.setItem('finova_user_profile', JSON.stringify(profile));

        // Apply theme
        document.documentElement.setAttribute('data-theme', profile.theme);
        if (profile.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [profile]);

    const updateProfile = (updates: Partial<UserProfile>) => {
        setProfile(prev => ({ ...prev, ...updates }));
    };

    const toggleTheme = () => {
        updateProfile({ theme: profile.theme === 'dark' ? 'light' : 'dark' });
    };

    return (
        <UserProfileContext.Provider value={{ profile, updateProfile, toggleTheme }}>
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (!context) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};
