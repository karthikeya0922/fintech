import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import {
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart,
    Line,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../context/UserProfileContext';

// Mock data matching reference
// const incomeExpenseData = { ... } // Replaced by context

const subscriptions = [
    { id: 1, name: 'Netflix Premium', category: 'Entertainment', amount: 649, color: '#E50914' },
    { id: 2, name: 'Spotify', category: 'Entertainment', amount: 119, color: '#1DB954' },
    { id: 3, name: 'Amazon Prime', category: 'Shopping', amount: 1499, color: '#FF9900' },
];

const balanceData = [
    { month: 'Jul', balance: 45000, expenses: 32000 },
    { month: 'Aug', balance: 52000, expenses: 38000 },
    { month: 'Sep', balance: 48000, expenses: 35000 },
    { month: 'Oct', balance: 61000, expenses: 42000 },
    { month: 'Nov', balance: 58000, expenses: 39000 },
    { month: 'Dec', balance: 72000, expenses: 48000 },
    { month: 'Jan', balance: 85000, expenses: 52000 },
];

const categoryData = [
    { name: 'Shopping', value: 35000, color: '#3b82f6' },
    { name: 'Food & Dining', value: 25000, color: '#00b8d4' },
    { name: 'Groceries', value: 23000, color: '#10b981' },
    { name: 'Bills', value: 18000, color: '#f59e0b' },
];

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

const formatCurrency = (value: number) => {
    if (value >= 100000) {
        return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString()}`;
};

const Dashboard = () => {
    const { user } = useAuth();
    const { profile } = useUserProfile(); // Get profile
    const firstName = profile.name.split(' ')[0] || user?.name.split(' ')[0] || 'there'; // Use profile name first

    const savings = profile.income - profile.expenses; // Calculate savings

    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    const totalSubs = subscriptions.reduce((sum, s) => sum + s.amount, 0);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="page-header">
                <h1 className="page-title">
                    Hey, <span className="gradient-text">{firstName}</span> 👋
                </h1>
                <p className="page-subtitle">{dateString}</p>
            </motion.div>

            {/* Top Row: Income/Expense Ring + Credit Score + Subscriptions */}
            <motion.div
                variants={itemVariants}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 1.5fr',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-md)'
                }}
            >
                {/* Income/Expense Ring Card */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
                        <div style={{ position: 'relative', width: 160, height: 160 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { value: profile.income, color: '#10b981' },
                                            { value: profile.expenses, color: '#ef4444' },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>NET</div>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                                    +{formatCurrency(savings)}
                                </div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Income</span>
                                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{formatCurrency(profile.income)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Expenses</span>
                                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{formatCurrency(profile.expenses)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Credit Score Card */}
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
                        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="var(--bg-tertiary)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="url(#scoreGradient)"
                                strokeWidth="8"
                                strokeDasharray={`${(785 / 900) * 264} 264`}
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#00b8d4" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: 700 }}>785</div>
                            <div style={{ fontSize: '10px', color: '#10b981', textTransform: 'uppercase' }}>
                                Very Good
                            </div>
                        </div>
                    </div>
                    <a href="/credit" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: 'var(--space-md)',
                        fontSize: '13px',
                        color: 'var(--accent-cyan)'
                    }}>
                        View details <ChevronRight size={14} />
                    </a>
                </div>

                {/* Subscriptions Card */}
                <div className="glass-card">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-md)'
                    }}>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Subscriptions</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{subscriptions.length} active</div>
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(totalSubs)}</div>
                    </div>
                    {subscriptions.map((sub) => (
                        <div key={sub.id} className="subscription-card">
                            <div
                                className="subscription-logo"
                                style={{ background: sub.color, color: 'white', fontSize: '14px', fontWeight: 700 }}
                            >
                                {sub.name[0]}
                            </div>
                            <div className="subscription-info">
                                <div className="subscription-name">{sub.name}</div>
                                <div className="subscription-details">{sub.category}</div>
                            </div>
                            <div className="subscription-amount">₹{sub.amount}</div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Bottom Row: Balance Chart + Categories */}
            <motion.div
                variants={itemVariants}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: 'var(--space-md)'
                }}
            >
                {/* Balance & Expenses Chart */}
                <div className="glass-card">
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Balance & Expenses</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Daily trend • Below 70 = Risk Zone
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                            Balance
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                            Expenses
                        </div>
                    </div>
                    <div style={{ height: 200 }}>
                        <ResponsiveContainer>
                            <AreaChart data={balanceData}>
                                <defs>
                                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                    tickFormatter={(v) => `₹${v / 1000}K`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#3b82f6"
                                    fill="url(#balanceGradient)"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expenses"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categories */}
                <div className="glass-card">
                    <h3 style={{ fontSize: '16px', marginBottom: 'var(--space-md)' }}>Categories</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <div style={{ width: 120, height: 120 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={55}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ flex: 1 }}>
                            {categoryData.map((cat) => (
                                <div
                                    key={cat.name}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '8px',
                                        fontSize: '12px'
                                    }}
                                >
                                    <span style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: cat.color,
                                        flexShrink: 0
                                    }} />
                                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{cat.name}</span>
                                    <span style={{ fontWeight: 500 }}>{formatCurrency(cat.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;
