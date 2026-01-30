import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    AlertTriangle,
    CheckCircle,
    MoreVertical,
    Plus,
    TrendingUp,
    DollarSign,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from 'recharts';
import { subscriptions, subscriptionAnalytics } from '../data/mockData';

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

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'var(--success)';
        case 'OVERDUE': return 'var(--danger)';
        case 'PAUSED': return 'var(--warning)';
        default: return 'var(--text-tertiary)';
    }
};

const getStatusBg = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'var(--success-light)';
        case 'OVERDUE': return 'var(--danger-light)';
        case 'PAUSED': return 'var(--warning-light)';
        default: return 'var(--bg-tertiary)';
    }
};

const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
};

const CATEGORY_COLORS = [
    '#00d4ff',
    '#7c3aed',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#3b82f6',
];

const Subscriptions = () => {
    const [filter, setFilter] = useState<string>('ALL');

    const filteredSubs = filter === 'ALL'
        ? subscriptions
        : subscriptions.filter(s => s.status === filter);

    const overdueCount = subscriptions.filter(s => s.status === 'OVERDUE').length;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="page-header">
                <h1 className="page-title">
                    <span className="gradient-text">Subscriptions</span>
                </h1>
                <p className="page-subtitle">
                    Manage and optimize your recurring expenses
                </p>
            </motion.div>

            {/* Analytics Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-4" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <DollarSign size={18} color="var(--accent-cyan)" />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Monthly Burn
                        </span>
                    </div>
                    <div className="metric-value">${subscriptionAnalytics.monthlyTotal.toFixed(2)}</div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <TrendingUp size={18} color="var(--accent-purple)" />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Yearly Projection
                        </span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${subscriptionAnalytics.yearlyProjection.toFixed(2)}
                    </div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <CheckCircle size={18} color="var(--success)" />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Active Subs
                        </span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--success)' }}>
                        {subscriptions.filter(s => s.status === 'ACTIVE').length}
                    </div>
                </div>

                <div className="glass-card" style={{
                    background: overdueCount > 0
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 15, 42, 0.6) 100%)'
                        : undefined,
                    borderColor: overdueCount > 0 ? 'rgba(239, 68, 68, 0.3)' : undefined,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <AlertTriangle size={18} color="var(--danger)" />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Overdue
                        </span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--danger)' }}>
                        {overdueCount}
                    </div>
                </div>
            </motion.div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--space-xl)' }}>
                {/* Subscription List */}
                <motion.div variants={itemVariants} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{
                        padding: 'var(--space-lg)',
                        borderBottom: '1px solid var(--border-glass-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <h3>Active Subscriptions</h3>
                        <motion.button
                            className="btn btn-primary"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Plus size={16} />
                            Add New
                        </motion.button>
                    </div>

                    {/* Filters */}
                    <div style={{
                        padding: 'var(--space-md) var(--space-lg)',
                        borderBottom: '1px solid var(--border-glass-light)',
                    }}>
                        <div className="tabs" style={{ marginBottom: 0 }}>
                            {['ALL', 'ACTIVE', 'OVERDUE'].map((status) => (
                                <button
                                    key={status}
                                    className={`tab ${filter === status ? 'active' : ''}`}
                                    onClick={() => setFilter(status)}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                        {filteredSubs.map((sub, index) => {
                            const daysUntil = getDaysUntil(sub.nextBilling);
                            return (
                                <motion.div
                                    key={sub.id}
                                    className="subscription-card"
                                    style={{
                                        borderBottom: index < filteredSubs.length - 1 ? '1px solid var(--border-glass-light)' : 'none',
                                    }}
                                    whileHover={{ background: 'var(--bg-card-hover)' }}
                                >
                                    <div
                                        className="subscription-logo"
                                        style={{
                                            background: `linear-gradient(135deg, ${sub.color}22 0%, ${sub.color}11 100%)`,
                                            border: `1px solid ${sub.color}33`,
                                        }}
                                    >
                                        {sub.logo}
                                    </div>

                                    <div className="subscription-info">
                                        <div className="subscription-name">{sub.name}</div>
                                        <div className="subscription-details">
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                marginRight: 'var(--space-md)',
                                            }}>
                                                <Calendar size={12} />
                                                {daysUntil > 0 ? `${daysUntil} days until renewal` :
                                                    daysUntil === 0 ? 'Due today' : `${Math.abs(daysUntil)} days overdue`}
                                            </span>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: getStatusBg(sub.status),
                                                    color: getStatusColor(sub.status),
                                                }}
                                            >
                                                {sub.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="subscription-price">
                                        <div className="subscription-amount">
                                            ${sub.amount.toFixed(2)}
                                        </div>
                                        <div className="subscription-cycle">/{sub.cycle}</div>
                                    </div>

                                    <motion.button
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-tertiary)',
                                            cursor: 'pointer',
                                            padding: 'var(--space-sm)',
                                        }}
                                        whileHover={{ color: 'var(--text-primary)' }}
                                    >
                                        <MoreVertical size={18} />
                                    </motion.button>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Right Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {/* Category Breakdown */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <h4 style={{ marginBottom: 'var(--space-lg)' }}>Spending by Category</h4>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-lg)' }}>
                            <ResponsiveContainer width={180} height={180}>
                                <PieChart>
                                    <Pie
                                        data={subscriptionAnalytics.categories}
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="amount"
                                    >
                                        {subscriptionAnalytics.categories.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {subscriptionAnalytics.categories.map((cat, index) => (
                                <div
                                    key={cat.name}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--space-xs) 0',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <div
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                background: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                                            }}
                                        />
                                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                            {cat.name}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                                            ${cat.amount.toFixed(2)}
                                        </span>
                                        <span style={{
                                            fontSize: 'var(--font-size-xs)',
                                            color: 'var(--text-tertiary)',
                                            width: 40,
                                            textAlign: 'right',
                                        }}>
                                            {cat.percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Upcoming Bills */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Upcoming This Week</h4>

                        {subscriptions
                            .filter(s => getDaysUntil(s.nextBilling) <= 7 && getDaysUntil(s.nextBilling) >= 0)
                            .map((sub) => (
                                <div
                                    key={sub.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-md)',
                                        padding: 'var(--space-sm) 0',
                                        borderBottom: '1px solid var(--border-glass-light)',
                                    }}
                                >
                                    <div style={{ fontSize: 'var(--font-size-xl)' }}>{sub.logo}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{sub.name}</div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                            {getDaysUntil(sub.nextBilling) === 0 ? 'Today' : `In ${getDaysUntil(sub.nextBilling)} days`}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 600 }}>${sub.amount.toFixed(2)}</div>
                                </div>
                            ))}

                        {subscriptions.filter(s => getDaysUntil(s.nextBilling) <= 7 && getDaysUntil(s.nextBilling) >= 0).length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: 'var(--space-lg)',
                                color: 'var(--text-tertiary)',
                                fontSize: 'var(--font-size-sm)',
                            }}>
                                No upcoming bills this week
                            </div>
                        )}
                    </motion.div>

                    {/* Overdue Alert */}
                    {overdueCount > 0 && (
                        <motion.div
                            variants={itemVariants}
                            className="glass-card"
                            style={{
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 15, 42, 0.6) 100%)',
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--danger)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <AlertTriangle size={24} color="#fff" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>Payment Overdue</div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                        {overdueCount} subscription{overdueCount > 1 ? 's' : ''} require{overdueCount === 1 ? 's' : ''} attention
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                className="btn btn-danger"
                                style={{ marginTop: 'var(--space-md)', width: '100%' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Review Now
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Subscriptions;
