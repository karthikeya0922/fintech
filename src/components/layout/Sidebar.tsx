import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Shield,
    TrendingUp,
    Newspaper,
    Wallet,
    Terminal,
    Settings,
    HelpCircle,
    LogOut,
    Zap,
    Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <motion.aside
            className="sidebar"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Zap size={20} color="#fff" />
                    </div>
                    <div>
                        <div className="sidebar-logo-text">Void</div>
                        <div className="sidebar-logo-version">FINTECH</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {/* Assistant Section */}
                <div className="nav-section">
                    <div className="nav-section-title">Assistant</div>
                    <NavLink to="#" className="nav-link">
                        <Zap className="nav-link-icon" size={18} />
                        <span>Void AI</span>
                    </NavLink>
                    <NavLink to="#" className="nav-link">
                        <Plus className="nav-link-icon" size={18} />
                        <span>New Chat</span>
                    </NavLink>
                </div>

                {/* Overview Section */}
                <div className="nav-section">
                    <div className="nav-section-title">Overview</div>
                    <NavLink
                        to="/"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <LayoutDashboard className="nav-link-icon" size={18} />
                        <span>Dashboard</span>
                    </NavLink>
                </div>

                {/* Financial Section */}
                <div className="nav-section">
                    <div className="nav-section-title">Financial</div>
                    <NavLink
                        to="/fraud"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Shield className="nav-link-icon" size={18} />
                        <span>Fraud Alerts</span>
                    </NavLink>
                    <NavLink
                        to="/portfolio"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <TrendingUp className="nav-link-icon" size={18} />
                        <span>Investments</span>
                    </NavLink>
                </div>

                {/* Insights Section */}
                <div className="nav-section">
                    <div className="nav-section-title">Insights</div>
                    <NavLink
                        to="/news"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Newspaper className="nav-link-icon" size={18} />
                        <span>News Hub</span>
                    </NavLink>
                    <NavLink
                        to="/subscriptions"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Wallet className="nav-link-icon" size={18} />
                        <span>Money Flow</span>
                    </NavLink>
                    <NavLink
                        to="/terminal"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Terminal className="nav-link-icon" size={18} />
                        <span>Terminal</span>
                    </NavLink>
                </div>

                {/* Settings Section */}
                <div className="nav-section" style={{ marginTop: 'auto' }}>
                    <NavLink to="/settings" className="nav-link">
                        <Settings className="nav-link-icon" size={18} />
                        <span>Settings</span>
                    </NavLink>
                    <NavLink to="/help" className="nav-link">
                        <HelpCircle className="nav-link-icon" size={18} />
                        <span>Help</span>
                    </NavLink>
                </div>
            </nav>

            {/* User Profile */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        {user ? getInitials(user.name) : 'U'}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name || 'User'}</div>
                        <div className="sidebar-user-role">Premium</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '4px',
                        }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
