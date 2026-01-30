import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Shield,
    CreditCard,
    Receipt,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    Trash2,
    ExternalLink,
    Filter,
    Settings,
} from 'lucide-react';
import { notifications } from '../data/mockData';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const getSeverityColor = (type: string) => {
    switch (type) {
        case 'CRITICAL': return 'var(--danger)';
        case 'HIGH': return 'var(--warning)';
        case 'MEDIUM': return 'var(--info)';
        case 'LOW': return 'var(--success)';
        default: return 'var(--text-tertiary)';
    }
};

const getSeverityBg = (type: string) => {
    switch (type) {
        case 'CRITICAL': return 'var(--danger-light)';
        case 'HIGH': return 'var(--warning-light)';
        case 'MEDIUM': return 'var(--info-light)';
        case 'LOW': return 'var(--success-light)';
        default: return 'var(--bg-tertiary)';
    }
};

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Security': return <Shield size={18} />;
        case 'Billing': return <Receipt size={18} />;
        case 'Investment': return <TrendingUp size={18} />;
        case 'Credit': return <CreditCard size={18} />;
        default: return <Bell size={18} />;
    }
};

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const Alerts = () => {
    const [filter, setFilter] = useState<string>('ALL');
    const [localNotifications, setLocalNotifications] = useState(notifications);

    const filteredNotifications = filter === 'ALL'
        ? localNotifications
        : filter === 'UNREAD'
            ? localNotifications.filter(n => !n.read)
            : localNotifications.filter(n => n.type === filter);

    const unreadCount = localNotifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setLocalNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setLocalNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const deleteNotification = (id: string) => {
        setLocalNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="page-header">
                <h1 className="page-title">
                    <span className="gradient-text">Alerts</span>
                </h1>
                <p className="page-subtitle">
                    Multi-channel notification center for critical events
                </p>
            </motion.div>

            {/* Stats Bar */}
            <motion.div variants={itemVariants} className="grid grid-cols-4" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Bell size={24} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
                            {localNotifications.length}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Total Alerts
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    background: unreadCount > 0
                        ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(15, 15, 42, 0.6) 100%)'
                        : undefined,
                    borderColor: unreadCount > 0 ? 'rgba(0, 212, 255, 0.3)' : undefined,
                }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--info-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--info)',
                    }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                            {unreadCount}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Unread
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--danger-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--danger)',
                    }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--danger)' }}>
                            {localNotifications.filter(n => n.type === 'CRITICAL' || n.type === 'HIGH').length}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            High Priority
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--success-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--success)',
                    }}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--success)' }}>
                            {localNotifications.filter(n => n.read).length}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Resolved
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                    padding: 'var(--space-lg)',
                    borderBottom: '1px solid var(--border-glass-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <h3>Notification Center</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <motion.button
                            className="btn btn-secondary"
                            onClick={markAllAsRead}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <CheckCircle size={16} />
                            Mark All Read
                        </motion.button>
                        <motion.button
                            className="btn btn-secondary"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Settings size={16} />
                            Settings
                        </motion.button>
                    </div>
                </div>

                {/* Filters */}
                <div style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    borderBottom: '1px solid var(--border-glass-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                }}>
                    <Filter size={16} color="var(--text-tertiary)" />
                    <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
                        {['ALL', 'UNREAD', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((level) => (
                            <button
                                key={level}
                                className={`tab ${filter === level ? 'active' : ''}`}
                                onClick={() => setFilter(level)}
                            >
                                {level}
                                {level === 'UNREAD' && unreadCount > 0 && (
                                    <span style={{
                                        marginLeft: 6,
                                        background: 'var(--accent-cyan)',
                                        color: 'var(--bg-primary)',
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: 'var(--radius-full)',
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications List */}
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                    <AnimatePresence>
                        {filteredNotifications.length === 0 ? (
                            <div className="empty-state">
                                <Bell size={48} style={{ opacity: 0.3 }} />
                                <h4 style={{ marginTop: 'var(--space-md)' }}>No notifications</h4>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                                    You're all caught up!
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <motion.div
                                    key={notification.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    style={{
                                        display: 'flex',
                                        gap: 'var(--space-md)',
                                        padding: 'var(--space-lg)',
                                        borderBottom: '1px solid var(--border-glass-light)',
                                        background: notification.read ? 'transparent' : 'rgba(0, 212, 255, 0.03)',
                                        transition: 'background 0.2s ease',
                                    }}
                                    onClick={() => markAsRead(notification.id)}
                                    whileHover={{ background: 'var(--bg-card)' }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 'var(--radius-md)',
                                        background: getSeverityBg(notification.type),
                                        color: getSeverityColor(notification.type),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {getCategoryIcon(notification.category)}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-sm)',
                                            marginBottom: 'var(--space-xs)',
                                        }}>
                                            <span style={{
                                                fontWeight: 600,
                                                color: notification.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                                            }}>
                                                {notification.title}
                                            </span>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: getSeverityBg(notification.type),
                                                    color: getSeverityColor(notification.type),
                                                    fontSize: '9px',
                                                }}
                                            >
                                                {notification.type}
                                            </span>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: 'var(--bg-tertiary)',
                                                    color: 'var(--text-tertiary)',
                                                    fontSize: '9px',
                                                }}
                                            >
                                                {notification.category}
                                            </span>
                                            {!notification.read && (
                                                <div style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: 'var(--accent-cyan)',
                                                    boxShadow: '0 0 8px var(--accent-cyan)',
                                                }} />
                                            )}
                                        </div>
                                        <p style={{
                                            fontSize: 'var(--font-size-sm)',
                                            color: 'var(--text-tertiary)',
                                            marginBottom: 'var(--space-sm)',
                                        }}>
                                            {notification.message}
                                        </p>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-md)',
                                            fontSize: 'var(--font-size-xs)',
                                            color: 'var(--text-muted)',
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={12} />
                                                {formatTimestamp(notification.timestamp)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--space-sm)',
                                        alignItems: 'flex-end',
                                    }}>
                                        <motion.button
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-tertiary)',
                                                cursor: 'pointer',
                                                padding: 'var(--space-xs)',
                                                borderRadius: 'var(--radius-sm)',
                                            }}
                                            whileHover={{ color: 'var(--accent-cyan)', background: 'var(--bg-tertiary)' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Navigate to action
                                            }}
                                        >
                                            <ExternalLink size={16} />
                                        </motion.button>
                                        <motion.button
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-tertiary)',
                                                cursor: 'pointer',
                                                padding: 'var(--space-xs)',
                                                borderRadius: 'var(--radius-sm)',
                                            }}
                                            whileHover={{ color: 'var(--danger)', background: 'var(--danger-light)' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Alerts;
