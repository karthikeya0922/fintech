import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    CreditCard,
    Shield,
    Moon,
    Sun,
    Save,
    Unlock,
    Mail,
    TrendingUp,
    PieChart,
    DollarSign,
    Target
} from 'lucide-react';
import { useUserProfile } from '../context/UserProfileContext';

// Types for form handling
interface UserProfileFormData {
    name: string;
    email: string;
    income: number;
    expenses: number;
    savingsGoal: number;
    portfolioValue: number;
}

const Settings = () => {
    const { profile, updateProfile, toggleTheme } = useUserProfile();
    const [activeTab, setActiveTab] = useState<'financial' | 'appearance' | 'account'>('financial');
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState<UserProfileFormData>({
        name: profile.name,
        email: profile.email,
        income: profile.income,
        expenses: profile.expenses,
        savingsGoal: profile.savingsGoal,
        portfolioValue: profile.portfolioValue
    });

    const [showSuccess, setShowSuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'name' || name === 'email' ? value : Number(value)
        }));
    };

    const handleSave = () => {
        updateProfile(formData);
        setIsEditing(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const tabs = [
        { id: 'financial', label: 'Financial Profile', icon: TrendingUp },
        { id: 'appearance', label: 'Appearance', icon: Sun },
        { id: 'account', label: 'Account & Security', icon: Shield },
    ];

    const inputContainerStyle = { marginBottom: 'var(--space-md)' };
    const labelStyle = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <header className="page-header">
                <h1 className="page-title">
                    <span className="gradient-text">Settings</span>
                </h1>
                <p className="page-subtitle">Manage your profile, preferences, and financial data.</p>
            </header>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 'var(--space-xl)', overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Financial Profile Tab */}
                    {activeTab === 'financial' && (
                        <div className="glass-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <PieChart size={24} style={{ color: 'var(--accent-cyan)' }} />
                                    Financial Details
                                </h2>
                                <button
                                    className={`btn ${isEditing ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={isEditing ? handleSave : () => setIsEditing(true)}
                                >
                                    {isEditing ? <Save size={18} /> : <div className="i-lucide-edit-2" />}
                                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                                </button>
                            </div>

                            <div className="grid grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
                                <div style={inputContainerStyle}>
                                    <label style={labelStyle}>
                                        <DollarSign size={16} /> Monthly Income (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="income"
                                        value={formData.income}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="auth-input"
                                        style={{ opacity: isEditing ? 1 : 0.7 }}
                                    />
                                </div>

                                <div style={inputContainerStyle}>
                                    <label style={labelStyle}>
                                        <CreditCard size={16} /> Monthly Expenses (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="expenses"
                                        value={formData.expenses}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="auth-input"
                                        style={{ opacity: isEditing ? 1 : 0.7 }}
                                    />
                                </div>

                                <div style={inputContainerStyle}>
                                    <label style={labelStyle}>
                                        <Target size={16} /> Savings Goal (%)
                                    </label>
                                    <input
                                        type="number"
                                        name="savingsGoal"
                                        value={formData.savingsGoal}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="auth-input"
                                        style={{ opacity: isEditing ? 1 : 0.7 }}
                                    />
                                </div>

                                <div style={inputContainerStyle}>
                                    <label style={labelStyle}>
                                        <TrendingUp size={16} /> Portfolio Value (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="portfolioValue"
                                        value={formData.portfolioValue}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="auth-input"
                                        style={{ opacity: isEditing ? 1 : 0.7 }}
                                    />
                                </div>
                            </div>

                            {!isEditing && (
                                <div style={{
                                    marginTop: 'var(--space-md)',
                                    padding: 'var(--space-md)',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    color: 'var(--success)'
                                }}>
                                    <SparklesIcon />
                                    <span>AI Tip: Based on your input, you are saving {((formData.income - formData.expenses) / formData.income * 100).toFixed(1)}% of your income.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="glass-card">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-lg)' }}>
                                <Sun size={24} style={{ color: 'var(--accent-gold)' }} />
                                App Appearance
                            </h2>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--space-md)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-lg)'
                            }}>
                                <div>
                                    <h3 style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Theme Preference</h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Switch between light and dark modes.</p>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className="btn btn-secondary"
                                    style={{ minWidth: '140px' }}
                                >
                                    {profile.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                                    {profile.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Account Tab */}
                    {activeTab === 'account' && (
                        <div className="grid" style={{ gap: 'var(--space-lg)' }}>
                            <div className="glass-card">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-lg)' }}>
                                    <User size={24} style={{ color: 'var(--accent-purple)' }} />
                                    Profile Information
                                </h2>

                                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                    <div style={inputContainerStyle}>
                                        <label style={labelStyle}>Display Name</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="auth-input"
                                            />
                                        </div>
                                    </div>
                                    <div style={inputContainerStyle}>
                                        <label style={labelStyle}>Email Address</label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="auth-input"
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-primary" onClick={() => updateProfile(formData)}>Update Profile</button>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-lg)', color: 'var(--danger)' }}>
                                    <Shield size={24} />
                                    Security
                                </h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <h3 style={{ fontWeight: 500 }}>Password</h3>
                                            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Last changed 3 months ago</p>
                                        </div>
                                        <button style={{ color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Unlock size={14} /> Forgot Password?
                                        </button>
                                    </div>
                                    <button className="btn" style={{
                                        width: '100%',
                                        borderColor: 'var(--danger)',
                                        color: 'var(--danger)',
                                        background: 'rgba(239, 68, 68, 0.05)'
                                    }}>
                                        Reset Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        bottom: '32px',
                        right: '32px',
                        background: 'var(--success)',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        zIndex: 1000
                    }}
                >
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px', borderRadius: '50%', display: 'flex' }}><Save size={14} /></div>
                    Settings saved successfully!
                </motion.div>
            )}
        </div>
    );
};

const SparklesIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
    </svg>
);

export default Settings;
