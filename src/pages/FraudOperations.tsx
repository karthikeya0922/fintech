import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    AlertTriangle,
    User,
    Smartphone,
    Globe,
    Activity,
    ChevronRight,
    CheckCircle,
    XCircle,
    Search,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import {
    LineChart,
    Line,
    ResponsiveContainer,
} from 'recharts';

const API_BASE = 'http://localhost:5000/api';

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

interface Alert {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    riskScore: number;
    status: string;
    entityType: string;
    entityId: string;
}

interface VelocityMetric {
    label: string;
    value: number | string;
    trend: number[];
    normal: number;
}

interface DefenseStats {
    modelVersion: string;
    accuracy: number;
    precision: number;
    recall: number;
    alertsToday: number;
    alertsBlocked: number;
    avgResponseTime: string;
}

interface EntityNode {
    id: string;
    type: string;
    label: string;
    riskScore: number;
}

interface EntityNetwork {
    nodes: EntityNode[];
    edges: { from: string; to: string }[];
}

const FraudOperations = () => {
    const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
    const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // API data states
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [velocityMetrics, setVelocityMetrics] = useState<VelocityMetric[]>([]);
    const [defenseStats, setDefenseStats] = useState<DefenseStats | null>(null);
    const [entityNetwork, setEntityNetwork] = useState<EntityNetwork | null>(null);

    // Loading states
    const [loadingAlerts, setLoadingAlerts] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingVelocity, setLoadingVelocity] = useState(false);
    const [loadingNetwork, setLoadingNetwork] = useState(false);

    // Action states
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch alerts from API
    const fetchAlerts = useCallback(async () => {
        setLoadingAlerts(true);
        try {
            const response = await fetch(`${API_BASE}/fraud/alerts?severity=${filterSeverity}`);
            if (response.ok) {
                const data = await response.json();
                setAlerts(data.alerts || []);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoadingAlerts(false);
        }
    }, [filterSeverity]);

    // Fetch defense stats
    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const response = await fetch(`${API_BASE}/fraud/stats`);
            if (response.ok) {
                const data = await response.json();
                setDefenseStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    // Fetch velocity metrics
    const fetchVelocity = useCallback(async () => {
        setLoadingVelocity(true);
        try {
            const response = await fetch(`${API_BASE}/fraud/velocity`);
            if (response.ok) {
                const data = await response.json();
                setVelocityMetrics(data.metrics || []);
            }
        } catch (error) {
            console.error('Error fetching velocity:', error);
        } finally {
            setLoadingVelocity(false);
        }
    }, []);

    // Fetch entity network
    const fetchNetwork = useCallback(async () => {
        setLoadingNetwork(true);
        try {
            const response = await fetch(`${API_BASE}/fraud/network/USR-4521`);
            if (response.ok) {
                const data = await response.json();
                setEntityNetwork(data);
            }
        } catch (error) {
            console.error('Error fetching network:', error);
        } finally {
            setLoadingNetwork(false);
        }
    }, []);

    // Refresh all data
    const refreshAll = () => {
        fetchAlerts();
        fetchStats();
        fetchVelocity();
        fetchNetwork();
    };

    // Initial load
    useEffect(() => {
        refreshAll();
    }, []);

    // Refetch alerts when filter changes
    useEffect(() => {
        fetchAlerts();
    }, [filterSeverity, fetchAlerts]);

    // Update alert status
    const updateAlertStatus = async (alertId: string, status: string) => {
        setActionLoading(alertId);
        try {
            const response = await fetch(`${API_BASE}/fraud/alerts/${alertId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                fetchAlerts();
            }
        } catch (error) {
            console.error('Error updating alert:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // Bulk approve low risk
    const handleBulkApprove = async () => {
        setActionLoading('bulk-approve');
        try {
            const response = await fetch(`${API_BASE}/fraud/bulk-approve`, {
                method: 'POST'
            });
            if (response.ok) {
                const result = await response.json();
                alert(`✅ ${result.message}`);
                fetchAlerts();
            }
        } catch (error) {
            console.error('Error bulk approving:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // Block suspicious IPs
    const handleBlockIPs = async () => {
        setActionLoading('block-ips');
        try {
            const response = await fetch(`${API_BASE}/fraud/block-ips`, {
                method: 'POST'
            });
            if (response.ok) {
                const result = await response.json();
                alert(`🛡️ ${result.message}`);
                fetchAlerts();
            }
        } catch (error) {
            console.error('Error blocking IPs:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // Filter alerts by search
    const filteredAlerts = alerts.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.entityId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'user': return <User size={16} />;
            case 'device': return <Smartphone size={16} />;
            case 'ip': return <Globe size={16} />;
            default: return <Activity size={16} />;
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">
                        <span className="gradient-text">Fraud Operations</span>
                    </h1>
                    <p className="page-subtitle">
                        Enterprise-grade threat detection and investigation platform
                    </p>
                </div>
                <motion.button
                    className="btn btn-secondary"
                    onClick={refreshAll}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                >
                    <RefreshCw size={16} className={loadingAlerts || loadingStats ? 'spin' : ''} />
                    Refresh Data
                </motion.button>
            </motion.div>

            {/* Defense Engine Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-4" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="glass-card" style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 15, 42, 0.6) 100%)',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <Shield size={20} color="var(--success)" />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>MODEL STATUS</span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--success)' }}>
                        {loadingStats ? '...' : 'ACTIVE'}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-xs)' }}>
                        {defenseStats?.modelVersion || 'Loading...'}
                    </div>
                </div>

                <div className="glass-card">
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }}>
                        ACCURACY
                    </div>
                    <div className="metric-value">{defenseStats?.accuracy || '--'}%</div>
                    <div className="progress-bar" style={{ marginTop: 'var(--space-sm)' }}>
                        <div className="progress-fill success" style={{ width: `${defenseStats?.accuracy || 0}%` }}></div>
                    </div>
                </div>

                <div className="glass-card">
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }}>
                        RECALL / PRECISION
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <div>
                            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                                {defenseStats?.recall || '--'}%
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Recall</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--accent-purple)' }}>
                                {defenseStats?.precision || '--'}%
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Precision</div>
                        </div>
                    </div>
                </div>

                <div className="glass-card">
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }}>
                        TODAY'S PERFORMANCE
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
                        <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--success)' }}>
                            {defenseStats?.alertsBlocked || '--'}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                            / {defenseStats?.alertsToday || '--'} auto-blocked
                        </span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-xs)' }}>
                        Response: {defenseStats?.avgResponseTime || '--'}
                    </div>
                </div>
            </motion.div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 'var(--space-xl)' }}>
                {/* Alert Queue */}
                <motion.div variants={itemVariants} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Queue Header */}
                    <div style={{
                        padding: 'var(--space-lg)',
                        borderBottom: '1px solid var(--border-glass-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div>
                            <h3 style={{ marginBottom: 'var(--space-xs)' }}>Alert Queue</h3>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                                {loadingAlerts ? 'Loading...' : `${filteredAlerts.length} alerts awaiting review`}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-sm)',
                                padding: 'var(--space-sm) var(--space-md)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                            }}>
                                <Search size={16} color="var(--text-tertiary)" />
                                <input
                                    type="text"
                                    placeholder="Search alerts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        fontSize: 'var(--font-size-sm)',
                                        outline: 'none',
                                        width: 120,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Severity Filters */}
                    <div style={{
                        padding: 'var(--space-md) var(--space-lg)',
                        borderBottom: '1px solid var(--border-glass-light)',
                    }}>
                        <div className="tabs" style={{ marginBottom: 0 }}>
                            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                                <button
                                    key={sev}
                                    className={`tab ${filterSeverity === sev ? 'active' : ''}`}
                                    onClick={() => setFilterSeverity(sev)}
                                >
                                    {sev}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Alert List */}
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {loadingAlerts ? (
                            <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                                <Loader2 size={32} className="spin" color="var(--accent-cyan)" />
                                <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-tertiary)' }}>Loading alerts...</p>
                            </div>
                        ) : filteredAlerts.length === 0 ? (
                            <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                No alerts found
                            </div>
                        ) : (
                            filteredAlerts.map((alert) => (
                                <motion.div
                                    key={alert.id}
                                    className="alert-item"
                                    style={{
                                        margin: 'var(--space-sm) var(--space-md)',
                                        cursor: 'pointer',
                                        border: selectedAlert === alert.id ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                                    }}
                                    onClick={() => setSelectedAlert(alert.id)}
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <div
                                        className="alert-icon"
                                        style={{ background: getSeverityBg(alert.type), color: getSeverityColor(alert.type) }}
                                    >
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div className="alert-content">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                            <span className="alert-title">{alert.title}</span>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: getSeverityBg(alert.type),
                                                    color: getSeverityColor(alert.type),
                                                    fontSize: '10px',
                                                }}
                                            >
                                                {alert.type}
                                            </span>
                                        </div>
                                        <p className="alert-description">{alert.description}</p>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-md)',
                                            marginTop: 'var(--space-sm)',
                                            fontSize: 'var(--font-size-xs)',
                                            color: 'var(--text-muted)',
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {getEntityIcon(alert.entityType)}
                                                {alert.entityId}
                                            </span>
                                            <span>Risk: {alert.riskScore}%</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-sm)' }}>
                                        <span className="alert-time">{alert.timestamp}</span>
                                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                            {alert.status === 'OPEN' && (
                                                <>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ padding: '4px 8px', fontSize: '10px' }}
                                                        onClick={(e) => { e.stopPropagation(); updateAlertStatus(alert.id, 'RESOLVED'); }}
                                                        disabled={actionLoading === alert.id}
                                                    >
                                                        {actionLoading === alert.id ? <Loader2 size={12} className="spin" /> : <CheckCircle size={12} />}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ padding: '4px 8px', fontSize: '10px' }}
                                                        onClick={(e) => { e.stopPropagation(); updateAlertStatus(alert.id, 'DISMISSED'); }}
                                                        disabled={actionLoading === alert.id}
                                                    >
                                                        <XCircle size={12} />
                                                    </button>
                                                </>
                                            )}
                                            <span
                                                className="badge"
                                                style={{
                                                    background: alert.status === 'RESOLVED' ? 'var(--success-light)' : 'var(--bg-tertiary)',
                                                    color: alert.status === 'RESOLVED' ? 'var(--success)' : 'var(--text-tertiary)',
                                                }}
                                            >
                                                {alert.status}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Right Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {/* Velocity Matrix */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                            <h4>Velocity Matrix</h4>
                            <button onClick={fetchVelocity} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                                <RefreshCw size={14} className={loadingVelocity ? 'spin' : ''} />
                            </button>
                        </div>
                        <div className="velocity-grid">
                            {loadingVelocity ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
                                    <Loader2 size={20} className="spin" color="var(--accent-cyan)" />
                                </div>
                            ) : velocityMetrics.map((metric) => (
                                <div key={metric.label} className="velocity-cell">
                                    <div className="velocity-label">{metric.label}</div>
                                    <div
                                        className="velocity-value"
                                        style={{
                                            color: Number(String(metric.value).replace(/[^0-9]/g, '')) > Number(metric.normal) * 1.5 ? 'var(--danger)' :
                                                Number(String(metric.value).replace(/[^0-9]/g, '')) > Number(metric.normal) ? 'var(--warning)' : 'var(--text-primary)'
                                        }}
                                    >
                                        {metric.value}
                                    </div>
                                    <div className="velocity-sparkline">
                                        <ResponsiveContainer width="100%" height={30}>
                                            <LineChart data={metric.trend.map((v, i) => ({ i, v }))}>
                                                <Line
                                                    type="monotone"
                                                    dataKey="v"
                                                    stroke="var(--accent-cyan)"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Entity Network Preview */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h4>Entity Network</h4>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                {entityNetwork?.nodes?.length || 0} entities
                            </span>
                        </div>
                        <div className="network-graph" style={{ height: 200 }}>
                            {loadingNetwork ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <Loader2 size={24} className="spin" color="var(--accent-cyan)" />
                                </div>
                            ) : (
                                entityNetwork?.nodes?.slice(0, 5).map((node, i) => {
                                    const positions = [
                                        { x: 100, y: 100 },
                                        { x: 50, y: 50 },
                                        { x: 150, y: 50 },
                                        { x: 50, y: 150 },
                                        { x: 150, y: 150 },
                                    ];
                                    return (
                                        <motion.div
                                            key={node.id}
                                            className={`network-node ${node.type}`}
                                            style={{
                                                left: positions[i]?.x || 100,
                                                top: positions[i]?.y || 100,
                                                width: i === 0 ? 50 : 36,
                                                height: i === 0 ? 50 : 36,
                                            }}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            whileHover={{ scale: 1.2 }}
                                            title={`${node.label} (Risk: ${node.riskScore}%)`}
                                        >
                                            {node.type === 'user' && <User size={i === 0 ? 24 : 16} color="#fff" />}
                                            {node.type === 'device' && <Smartphone size={16} color="#fff" />}
                                            {node.type === 'ip' && <Globe size={16} color="#fff" />}
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div variants={itemVariants} className="glass-card">
                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Quick Actions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            <motion.button
                                className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'space-between' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleBulkApprove}
                                disabled={actionLoading === 'bulk-approve'}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    {actionLoading === 'bulk-approve' ? <Loader2 size={18} className="spin" /> : <CheckCircle size={18} />}
                                    Bulk Approve Low Risk
                                </span>
                                <ChevronRight size={18} />
                            </motion.button>
                            <motion.button
                                className="btn btn-secondary"
                                style={{ width: '100%', justifyContent: 'space-between' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleBlockIPs}
                                disabled={actionLoading === 'block-ips'}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    {actionLoading === 'block-ips' ? <Loader2 size={18} className="spin" /> : <XCircle size={18} />}
                                    Block Suspicious IPs
                                </span>
                                <ChevronRight size={18} />
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default FraudOperations;
