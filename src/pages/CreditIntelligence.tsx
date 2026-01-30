import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Info,
    CheckCircle,
    HelpCircle,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
} from 'recharts';
import { creditScoreData } from '../data/mockData';

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

const getScoreColor = (score: number) => {
    if (score >= 800) return '#10b981';
    if (score >= 740) return '#00d4ff';
    if (score >= 670) return '#3b82f6';
    if (score >= 580) return '#f59e0b';
    return '#ef4444';
};

const getScoreRating = (score: number) => {
    if (score >= 800) return 'Excellent';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
};

const CreditIntelligence = () => {
    const scorePercent = ((creditScoreData.score - creditScoreData.minScore) /
        (creditScoreData.maxScore - creditScoreData.minScore)) * 100;

    const gaugeData = [
        {
            name: 'score',
            value: scorePercent,
            fill: `url(#scoreGradient)`,
        },
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="page-header">
                <h1 className="page-title">
                    <span className="gradient-text">Credit Intelligence</span>
                </h1>
                <p className="page-subtitle">
                    AI-powered credit analysis with explainable scoring factors
                </p>
            </motion.div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 'var(--space-xl)' }}>
                {/* Left Column - Score Gauge */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    <motion.div variants={itemVariants} className="glass-card" style={{ textAlign: 'center' }}>
                        <h3 style={{ marginBottom: 'var(--space-xl)' }}>Your Credit Score</h3>

                        <div style={{ position: 'relative', width: 280, height: 280, margin: '0 auto' }}>
                            <svg style={{ position: 'absolute', top: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#00d4ff" />
                                        <stop offset="100%" stopColor="#7c3aed" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <ResponsiveContainer width={280} height={280}>
                                <RadialBarChart
                                    innerRadius="75%"
                                    outerRadius="100%"
                                    data={gaugeData}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <RadialBar
                                        background={{ fill: 'rgba(255,255,255,0.05)' }}
                                        dataKey="value"
                                        cornerRadius={10}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>

                            {/* Center Score */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -30%)',
                                textAlign: 'center',
                            }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                                    style={{
                                        fontSize: 'var(--font-size-5xl)',
                                        fontWeight: 800,
                                        background: 'var(--gradient-primary)',
                                        WebkitBackgroundClip: 'text',
                                        backgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    {creditScoreData.score}
                                </motion.div>
                                <div style={{
                                    fontSize: 'var(--font-size-lg)',
                                    fontWeight: 600,
                                    color: getScoreColor(creditScoreData.score),
                                    marginTop: 'var(--space-xs)',
                                }}>
                                    {getScoreRating(creditScoreData.score)}
                                </div>
                            </div>
                        </div>

                        {/* Score Range */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0 var(--space-lg)',
                            marginTop: 'var(--space-md)',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-tertiary)',
                        }}>
                            <span>{creditScoreData.minScore}</span>
                            <span>{creditScoreData.maxScore}</span>
                        </div>

                        <div style={{
                            marginTop: 'var(--space-xl)',
                            padding: 'var(--space-md)',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-secondary)',
                        }}>
                            <Info size={14} style={{ display: 'inline', marginRight: 6 }} />
                            Last updated: {creditScoreData.lastUpdated}
                        </div>
                    </motion.div>

                    {/* Score History */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Score History</h4>
                        <div style={{ height: 150 }}>
                            <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={creditScoreData.history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="rgba(255,255,255,0.3)"
                                        fontSize={11}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        domain={[700, 760]}
                                        stroke="rgba(255,255,255,0.3)"
                                        fontSize={11}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(15, 15, 42, 0.95)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#00d4ff"
                                        strokeWidth={2}
                                        dot={{ fill: '#00d4ff', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)',
                            marginTop: 'var(--space-md)',
                            color: 'var(--success)',
                            fontSize: 'var(--font-size-sm)',
                        }}>
                            <TrendingUp size={16} />
                            <span>+24 points in 6 months</span>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column - Factors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {/* SHAP Explainability */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                            <h3>Score Explainability</h3>
                            <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <HelpCircle size={12} />
                                SHAP Analysis
                            </span>
                        </div>
                        <p style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-tertiary)',
                            marginBottom: 'var(--space-lg)',
                        }}>
                            AI-powered analysis explaining how each factor impacts your credit score
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {creditScoreData.shapValues.map((item, index) => (
                                <motion.div
                                    key={item.factor}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-md)',
                                        padding: 'var(--space-md)',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: `3px solid ${item.positive ? 'var(--success)' : 'var(--danger)'}`,
                                    }}
                                >
                                    <div style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 'var(--radius-sm)',
                                        background: item.positive ? 'var(--success-light)' : 'var(--danger-light)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: item.positive ? 'var(--success)' : 'var(--danger)',
                                    }}>
                                        {item.positive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
                                            {item.factor}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontWeight: 700,
                                        fontSize: 'var(--font-size-lg)',
                                        color: item.positive ? 'var(--success)' : 'var(--danger)',
                                    }}>
                                        {item.positive ? '+' : ''}{item.impact}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Factor Breakdown */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <h3 style={{ marginBottom: 'var(--space-lg)' }}>Factor Breakdown</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                            {creditScoreData.factors.map((factor, index) => (
                                <div key={factor.name}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: 'var(--space-sm)',
                                    }}>
                                        <div>
                                            <span style={{ fontWeight: 500 }}>{factor.name}</span>
                                            <span style={{
                                                marginLeft: 'var(--space-sm)',
                                                fontSize: 'var(--font-size-xs)',
                                                color: 'var(--text-tertiary)',
                                            }}>
                                                ({factor.impact}% of score)
                                            </span>
                                        </div>
                                        <span
                                            className="badge"
                                            style={{
                                                background: factor.score === 'Excellent' ? 'var(--success-light)' :
                                                    factor.score === 'Good' ? 'var(--info-light)' :
                                                        factor.score === 'Fair' ? 'var(--warning-light)' :
                                                            'var(--danger-light)',
                                                color: factor.score === 'Excellent' ? 'var(--success)' :
                                                    factor.score === 'Good' ? 'var(--info)' :
                                                        factor.score === 'Fair' ? 'var(--warning)' :
                                                            'var(--danger)',
                                            }}
                                        >
                                            {factor.score}
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <motion.div
                                            className={`progress-fill ${factor.score === 'Excellent' ? 'success' :
                                                factor.score === 'Good' ? '' :
                                                    factor.score === 'Fair' ? 'warning' :
                                                        'danger'
                                                }`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${factor.impact * 2.5}%` }}
                                            transition={{ delay: index * 0.1, duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Improvement Tips */}
                    <motion.div variants={itemVariants} className="glass-card" style={{
                        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(15, 15, 42, 0.6) 100%)',
                        borderColor: 'rgba(0, 212, 255, 0.2)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                            <CheckCircle size={20} color="var(--accent-cyan)" />
                            <h4>AI Recommendations</h4>
                        </div>
                        <ul style={{
                            listStyle: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-sm)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-secondary)',
                        }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>→</span>
                                Reduce new credit inquiries to improve score by ~15 points
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>→</span>
                                Continue on-time payments to maintain excellent history
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>→</span>
                                Keep credit utilization below 30% for optimal scoring
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default CreditIntelligence;
