import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    DollarSign,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    PlusCircle,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { portfolioAssets, portfolioSummary, cashFlowData } from '../data/mockData';

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

const ALLOCATION_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

const getAssetIcon = (type: string) => {
    const colors: Record<string, string> = {
        stock: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        crypto: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        bond: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        etf: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    };
    return colors[type] || colors.stock;
};

const Portfolio = () => {
    const [timeframe, setTimeframe] = useState('6M');

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="page-header">
                <h1 className="page-title">
                    <span className="gradient-text">Portfolio</span>
                </h1>
                <p className="page-subtitle">
                    Multi-asset wealth tracking and performance analytics
                </p>
            </motion.div>

            {/* Portfolio Summary */}
            <motion.div variants={itemVariants} className="grid grid-cols-4" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="glass-card" style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(15, 15, 42, 0.6) 100%)',
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <DollarSign size={18} color="var(--accent-cyan)" />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Total Value
                        </span>
                    </div>
                    <div className="metric-value">${portfolioSummary.totalValue.toLocaleString()}</div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <TrendingUp size={18} color="var(--success)" />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Total Gain
                        </span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--success)' }}>
                        +${portfolioSummary.totalGain.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--success)' }}>
                        +{portfolioSummary.totalGainPercent}%
                    </div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <BarChart3 size={18} color="var(--accent-purple)" />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Day Change
                        </span>
                    </div>
                    <div style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 700,
                        color: portfolioSummary.dayChange >= 0 ? 'var(--success)' : 'var(--danger)',
                    }}>
                        {portfolioSummary.dayChange >= 0 ? '+' : ''}${portfolioSummary.dayChange.toLocaleString()}
                    </div>
                    <div style={{
                        fontSize: 'var(--font-size-sm)',
                        color: portfolioSummary.dayChange >= 0 ? 'var(--success)' : 'var(--danger)',
                    }}>
                        {portfolioSummary.dayChange >= 0 ? '+' : ''}{portfolioSummary.dayChangePercent}%
                    </div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Assets
                        </span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
                        {portfolioAssets.length}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                        4 asset classes
                    </div>
                </div>
            </motion.div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--space-xl)' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {/* Cash Flow Chart */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <div>
                                <h3 style={{ marginBottom: 'var(--space-xs)' }}>Cash Flow</h3>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                                    Inflow vs Outflow trends
                                </p>
                            </div>
                            <div className="tabs" style={{ marginBottom: 0, width: 'auto' }}>
                                {['1M', '3M', '6M', '1Y'].map((tf) => (
                                    <button
                                        key={tf}
                                        className={`tab ${timeframe === tf ? 'active' : ''}`}
                                        onClick={() => setTimeframe(tf)}
                                        style={{ padding: 'var(--space-xs) var(--space-sm)' }}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={cashFlowData}>
                                    <defs>
                                        <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="rgba(255,255,255,0.3)"
                                        fontSize={12}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.3)"
                                        fontSize={12}
                                        tickLine={false}
                                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(15, 15, 42, 0.95)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                        }}
                                        formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="inflow"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fill="url(#inflowGradient)"
                                        name="Inflow"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="outflow"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        fill="url(#outflowGradient)"
                                        name="Outflow"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 'var(--space-xl)',
                            marginTop: 'var(--space-md)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Inflow</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Outflow</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Asset Holdings */}
                    <motion.div variants={itemVariants} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{
                            padding: 'var(--space-lg)',
                            borderBottom: '1px solid var(--border-glass-light)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <h3>Holdings</h3>
                            <motion.button
                                className="btn btn-primary"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <PlusCircle size={16} />
                                Add Asset
                            </motion.button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Asset</th>
                                        <th>Price</th>
                                        <th>Holdings</th>
                                        <th>Value</th>
                                        <th>Change</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolioAssets.map((asset) => (
                                        <motion.tr
                                            key={asset.id}
                                            whileHover={{ background: 'var(--bg-card)' }}
                                        >
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                                    <div
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 'var(--radius-md)',
                                                            background: getAssetIcon(asset.type),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 700,
                                                            fontSize: 'var(--font-size-xs)',
                                                            color: '#fff',
                                                        }}
                                                    >
                                                        {asset.symbol.slice(0, 3)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{asset.name}</div>
                                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                                            {asset.symbol} • {asset.type.toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>
                                                ${asset.currentPrice.toLocaleString()}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {asset.shares} {asset.type === 'crypto' ? 'units' : 'shares'}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                ${asset.value.toLocaleString()}
                                            </td>
                                            <td>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-xs)',
                                                    color: asset.changePercent >= 0 ? 'var(--success)' : 'var(--danger)',
                                                }}>
                                                    {asset.changePercent >= 0 ? (
                                                        <ArrowUpRight size={16} />
                                                    ) : (
                                                        <ArrowDownRight size={16} />
                                                    )}
                                                    <span style={{ fontWeight: 500 }}>
                                                        {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent}%
                                                    </span>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {/* Allocation Chart */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <h4 style={{ marginBottom: 'var(--space-lg)' }}>Asset Allocation</h4>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-lg)' }}>
                            <ResponsiveContainer width={180} height={180}>
                                <PieChart>
                                    <Pie
                                        data={portfolioSummary.allocation}
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {portfolioSummary.allocation.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={ALLOCATION_COLORS[index]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {portfolioSummary.allocation.map((item, index) => (
                                <div
                                    key={item.type}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <div
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                background: ALLOCATION_COLORS[index],
                                            }}
                                        />
                                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                                            ${item.value.toLocaleString()}
                                        </span>
                                        <span style={{
                                            fontSize: 'var(--font-size-xs)',
                                            color: 'var(--text-tertiary)',
                                            width: 40,
                                            textAlign: 'right',
                                        }}>
                                            {item.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Performance Metrics */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Performance Metrics</h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: 'var(--space-sm) 0',
                                borderBottom: '1px solid var(--border-glass-light)',
                            }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    Best Performer
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <span style={{ fontWeight: 600 }}>ETH</span>
                                    <span style={{ color: 'var(--success)', fontSize: 'var(--font-size-sm)' }}>+3.77%</span>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: 'var(--space-sm) 0',
                                borderBottom: '1px solid var(--border-glass-light)',
                            }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    Worst Performer
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <span style={{ fontWeight: 600 }}>GOOGL</span>
                                    <span style={{ color: 'var(--danger)', fontSize: 'var(--font-size-sm)' }}>-1.28%</span>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: 'var(--space-sm) 0',
                                borderBottom: '1px solid var(--border-glass-light)',
                            }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    Avg. Holding Period
                                </span>
                                <span style={{ fontWeight: 600 }}>8.2 months</span>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: 'var(--space-sm) 0',
                            }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    Dividend Yield
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--success)' }}>2.4%</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Quick Actions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            <motion.button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Rebalance Portfolio
                            </motion.button>
                            <motion.button
                                className="btn btn-secondary"
                                style={{ width: '100%' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Export Report
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default Portfolio;
