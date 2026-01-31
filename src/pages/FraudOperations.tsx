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
    MapPin,
    Wifi,
    Play,
    X,
    Monitor,
    AlertOctagon,
} from 'lucide-react';
import {
    LineChart,
    Line,
    ResponsiveContainer,
    AreaChart,
    Area,
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
    isCritical?: boolean;
    x?: number;
    y?: number;
    dist?: number;
    angle?: number;
}

interface EntityNetwork {
    nodes: EntityNode[];
    edges: { from: string; to: string }[];
}

// Buckets Analysis Interfaces
interface BucketsData {
    fraud_alert_summary: {
        payments_analyzed: number;
        fraud_detected: number;
        high_risk_count: number;
        medium_risk_count: number;
        low_risk_count: number;
        risk_level: string;
    };
    fraud_causes: {
        transaction_id: string;
        cause: string;
        risk_score: number;
        confidence: string;
        explanation: string;
    }[];
    device_insights: {
        device: string;
        os: string;
        browser: string;
        is_new: boolean;
        accounts_linked: number;
        flagged: boolean;
    }[];
    geo_insights: {
        country: string;
        state: string;
        city: string;
        suspicious: boolean;
        impossible_travel: boolean;
        reason?: string;
    }[];
    ip_vpn_analysis: {
        ip: string;
        vpn_detected: boolean;
        proxy_detected: boolean;
        tor_detected: boolean;
        ip_type: string;
        users_count: number;
        risk_score: number;
    }[];
    alerts: {
        severity: string;
        message: string;
        count: number;
    }[];
    generated_at: string;
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

    // Buckets Analysis states
    const [showBuckets, setShowBuckets] = useState(false);
    const [bucketsData, setBucketsData] = useState<BucketsData | null>(null);
    const [loadingBuckets, setLoadingBuckets] = useState(false);

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

    // Fetch Buckets Analysis (READ-ONLY)
    const fetchBuckets = async () => {
        setLoadingBuckets(true);
        setShowBuckets(true);
        try {
            const response = await fetch(`${API_BASE}/fraud/buckets`);
            if (response.ok) {
                const data = await response.json();
                setBucketsData(data);
            }
        } catch (error) {
            console.error('Error fetching buckets:', error);
        } finally {
            setLoadingBuckets(false);
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
        <>
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
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <motion.button
                            className="btn btn-primary"
                            onClick={fetchBuckets}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                            disabled={loadingBuckets}
                        >
                            {loadingBuckets ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
                            Start Buckets
                        </motion.button>
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
                    </div>
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

                    {/* Right Panel - Investigation Blade */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

                        {/* Active Investigation Header */}
                        <div className="investigation-panel">
                            <div style={{
                                padding: 'var(--space-md)',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(0,0,0,0.2)'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <h3 style={{ fontSize: '16px', letterSpacing: '1px' }}>INVESTIGATION <span style={{ color: 'var(--text-tertiary)' }}>#C8D3</span></h3>
                                        <span className="badge badge-danger">CRITICAL</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Assigned to: <span style={{ color: 'var(--text-secondary)' }}>Unassigned</span>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-secondary" style={{ width: 32, height: 32, padding: 0 }}>
                                    <XCircle size={16} />
                                </button>
                            </div>

                            {/* Network Topology */}
                            <div style={{ padding: 'var(--space-md)' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-sm)',
                                    marginBottom: 'var(--space-md)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    letterSpacing: '1px'
                                }}>
                                    <Activity size={14} /> NETWORK TOPOLOGY
                                </div>

                                <div className="network-topology">
                                    {/* Dynamic Nodes from Python Backend */}
                                    {entityNetwork?.nodes?.map((node, i) => {
                                        const isCenter = node.id === 'USR-4521';
                                        const Icon = node.type === 'user' ? User :
                                            node.type === 'device' ? Smartphone :
                                                node.type === 'ip' ? AlertTriangle :
                                                    node.type === 'card' ? Shield : Smartphone;

                                        const x = node.x || 0;
                                        const y = node.y || 0;
                                        const dist = node.dist || 0;

                                        const angleRad = Math.atan2(y, x);
                                        const angleDeg = angleRad * (180 / Math.PI);
                                        const isTopHalf = y < 0;
                                        // Backend x,y are from spring_layout.
                                        // If backend Y is up, screen Y is down.
                                        // But typically spring_layout returns standard Cartesian.
                                        // We likely mapped it directly.

                                        return (
                                            <div key={node.id}>
                                                {/* Connection Line (Skip for center) */}
                                                {!isCenter && (
                                                    <div
                                                        className="node-connection"
                                                        style={{
                                                            width: dist - 25, // Subtract center radius
                                                            left: '69%', // Shift center right
                                                            top: '58%',
                                                            transform: `translate(-50%, -50%) rotate(${angleDeg}deg) translate(25px, 0)`
                                                        }}
                                                    />
                                                )}

                                                {/* Node */}
                                                <motion.div
                                                    className={`network-node ${isCenter ? 'center' : ''} ${node.isCritical ? 'critical' : (node.riskScore > 50 ? 'warning' : '')}`}
                                                    style={{
                                                        top: `calc(50% + ${y}px)`,
                                                        left: `calc(45% + ${x}px)`,
                                                        transform: 'translate(-50%, -50%)',
                                                        zIndex: isCenter ? 50 : 10
                                                    }}
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: i * 0.1 }}
                                                >
                                                    <Icon size={isCenter ? 32 : 20} color={node.riskScore < 20 && !isCenter ? 'var(--accent-blue)' : '#fff'} />

                                                    {!isCenter && (node.isCritical || node.riskScore > 50) && (
                                                        <div className={`node-badge badge-${node.isCritical ? 'danger' : 'warning'}`}>
                                                            {node.isCritical ? 'CRITICAL' : 'WARNING'}
                                                        </div>
                                                    )}

                                                    <div
                                                        className="node-label"
                                                        style={{
                                                            top: isTopHalf ? 'auto' : '100%',
                                                            bottom: isTopHalf ? '100%' : 'auto',
                                                            marginTop: isTopHalf ? 0 : '8px',
                                                            marginBottom: isTopHalf ? '8px' : 0,
                                                        }}
                                                    >
                                                        {node.label}
                                                    </div>
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </div>


                            </div>

                            {/* Velocity Matrix */}
                            <div style={{ padding: 'var(--space-md)', paddingTop: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-sm)',
                                    marginBottom: 'var(--space-md)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    letterSpacing: '1px'
                                }}>
                                    <Activity size={14} /> VELOCITY MATRIX
                                </div>

                                <div className="velocity-table-container">
                                    <div className="velocity-row velocity-header">
                                        <div>METRIC</div>
                                        <div style={{ textAlign: 'center' }}>1 HOUR</div>
                                        <div style={{ textAlign: 'center' }}>24 HOURS</div>
                                    </div>
                                    <div className="velocity-row">
                                        <div>
                                            <div className="velocity-metric-name">Transaction Count</div>
                                            <div className="velocity-metric-sub">Total approved attempts</div>
                                        </div>
                                        <div className="velocity-stat">
                                            12
                                            <span className="velocity-change" style={{ color: 'var(--danger)' }}>↑ 120%</span>
                                        </div>
                                        <div className="velocity-stat">
                                            63
                                            <span className="velocity-change" style={{ color: 'var(--warning)' }}>↑ 45%</span>
                                        </div>
                                    </div>
                                    <div className="velocity-row" style={{ borderBottom: 'none' }}>
                                        <div>
                                            <div className="velocity-metric-name">Total Volume</div>
                                            <div className="velocity-metric-sub">Value (INR)</div>
                                        </div>
                                        <div className="velocity-stat">
                                            ₹5,171
                                        </div>
                                        <div className="velocity-stat">
                                            ₹24,412
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'var(--space-md)', height: 60 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                        <span>Velocity Trend (Last 20 Events)</span>
                                        <span style={{ color: 'var(--accent-blue)' }}>High Velocity Detected</span>
                                    </div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={[
                                            { v: 10 }, { v: 15 }, { v: 8 }, { v: 12 }, { v: 20 },
                                            { v: 35 }, { v: 25 }, { v: 40 }, { v: 60 }, { v: 45 },
                                            { v: 55 }, { v: 70 }, { v: 65 }, { v: 80 }, { v: 75 },
                                            { v: 90 }, { v: 85 }, { v: 95 }, { v: 100 }, { v: 90 }
                                        ]}>
                                            <defs>
                                                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area
                                                type="monotone"
                                                dataKey="v"
                                                stroke="#3b82f6"
                                                fill="url(#velocityGradient)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div >

            {/* Buckets Analysis Modal */}
            {showBuckets && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 1000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: 'var(--space-xl)',
                        overflowY: 'auto',
                    }}
                    onClick={() => setShowBuckets(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card"
                        style={{
                            width: '100%',
                            maxWidth: 1200,
                            maxHeight: '90vh',
                            overflow: 'auto',
                            margin: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid var(--border-glass-light)',
                            padding: 'var(--space-lg)',
                            position: 'sticky',
                            top: 0,
                            background: 'var(--bg-secondary)',
                            zIndex: 10,
                        }}>
                            <div>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <Shield size={24} color="var(--accent-cyan)" />
                                    <span className="gradient-text">Fraud Intelligence Buckets</span>
                                </h2>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-xs)' }}>
                                    Comprehensive read-only fraud analysis • Generated: {bucketsData?.generated_at ? new Date(bucketsData.generated_at).toLocaleTimeString() : 'Loading...'}
                                </p>
                            </div>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowBuckets(false)}
                                style={{ width: 40, height: 40, padding: 0 }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {loadingBuckets ? (
                            <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
                                <Loader2 size={48} className="spin" color="var(--accent-cyan)" />
                                <p style={{ marginTop: 'var(--space-lg)', color: 'var(--text-tertiary)' }}>
                                    Analyzing fraud patterns...
                                </p>
                            </div>
                        ) : bucketsData ? (
                            <div style={{ padding: 'var(--space-lg)' }}>
                                {/* 1. Fraud Alert Summary */}
                                <div style={{ marginBottom: 'var(--space-xl)' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 600, letterSpacing: '1px' }}>
                                        <AlertOctagon size={16} /> FRAUD ALERT SUMMARY
                                    </h3>
                                    <div className="grid grid-cols-4" style={{ gap: 'var(--space-md)' }}>
                                        <div className="glass-card" style={{ padding: 'var(--space-md)', background: 'rgba(59, 130, 246, 0.1)' }}>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>PAYMENTS ANALYZED</div>
                                            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                                                {bucketsData.fraud_alert_summary.payments_analyzed.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="glass-card" style={{ padding: 'var(--space-md)', background: 'rgba(239, 68, 68, 0.1)' }}>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>FRAUD DETECTED</div>
                                            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--danger)' }}>
                                                {bucketsData.fraud_alert_summary.fraud_detected}
                                            </div>
                                        </div>
                                        <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>RISK BREAKDOWN</div>
                                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
                                                <span className="badge badge-danger">{bucketsData.fraud_alert_summary.high_risk_count} HIGH</span>
                                                <span className="badge badge-warning">{bucketsData.fraud_alert_summary.medium_risk_count} MED</span>
                                                <span className="badge badge-success">{bucketsData.fraud_alert_summary.low_risk_count} LOW</span>
                                            </div>
                                        </div>
                                        <div className="glass-card" style={{
                                            padding: 'var(--space-md)',
                                            background: bucketsData.fraud_alert_summary.risk_level === 'High'
                                                ? 'rgba(239, 68, 68, 0.15)'
                                                : bucketsData.fraud_alert_summary.risk_level === 'Medium'
                                                    ? 'rgba(245, 158, 11, 0.15)'
                                                    : 'rgba(16, 185, 129, 0.15)'
                                        }}>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>RISK LEVEL</div>
                                            <div style={{
                                                fontSize: 'var(--font-size-xl)',
                                                fontWeight: 700,
                                                color: bucketsData.fraud_alert_summary.risk_level === 'High'
                                                    ? 'var(--danger)'
                                                    : bucketsData.fraud_alert_summary.risk_level === 'Medium'
                                                        ? 'var(--warning)'
                                                        : 'var(--success)'
                                            }}>
                                                {bucketsData.fraud_alert_summary.risk_level.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Fraud Cause Breakdown */}
                                <div style={{ marginBottom: 'var(--space-xl)' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 600, letterSpacing: '1px' }}>
                                        <AlertTriangle size={16} /> FRAUD CAUSE BREAKDOWN
                                    </h3>
                                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-tertiary)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                                    <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left' }}>TRANSACTION</th>
                                                    <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left' }}>CAUSE</th>
                                                    <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center' }}>RISK</th>
                                                    <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center' }}>CONFIDENCE</th>
                                                    <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left' }}>EXPLANATION</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bucketsData.fraud_causes.map((cause, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-glass-light)' }}>
                                                        <td style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>{cause.transaction_id}</td>
                                                        <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                                                            <span className="badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>{cause.cause}</span>
                                                        </td>
                                                        <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center' }}>
                                                            <span style={{ color: cause.risk_score >= 80 ? 'var(--danger)' : cause.risk_score >= 50 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                                                                {cause.risk_score}%
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center' }}>
                                                            <span className="badge" style={{
                                                                background: cause.confidence === 'High' ? 'var(--danger-light)' : 'var(--warning-light)',
                                                                color: cause.confidence === 'High' ? 'var(--danger)' : 'var(--warning)'
                                                            }}>{cause.confidence}</span>
                                                        </td>
                                                        <td style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{cause.explanation}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* 3. Device Analysis & 4. Geo Insights (Side by Side) */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                                    {/* Device Analysis */}
                                    <div>
                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 600, letterSpacing: '1px' }}>
                                            <Monitor size={16} /> DEVICE ANALYSIS
                                        </h3>
                                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                            {bucketsData.device_insights.map((device, i) => (
                                                <div key={i} style={{
                                                    padding: 'var(--space-md)',
                                                    borderBottom: i < bucketsData.device_insights.length - 1 ? '1px solid var(--border-glass-light)' : 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-md)',
                                                    background: device.flagged ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                                                }}>
                                                    <div style={{
                                                        width: 40, height: 40, borderRadius: 'var(--radius-md)',
                                                        background: device.flagged ? 'var(--danger-light)' : 'var(--bg-tertiary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        <Smartphone size={20} color={device.flagged ? 'var(--danger)' : 'var(--text-secondary)'} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{device.device}</div>
                                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{device.os} • {device.browser}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        {device.is_new && <span className="badge badge-warning" style={{ marginRight: 'var(--space-xs)' }}>NEW</span>}
                                                        {device.flagged && <span className="badge badge-danger">FLAGGED</span>}
                                                        {device.accounts_linked > 1 && (
                                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--warning)', marginTop: '2px' }}>
                                                                {device.accounts_linked} accounts linked
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Geo Insights */}
                                    <div>
                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 600, letterSpacing: '1px' }}>
                                            <MapPin size={16} /> GEOLOCATION INSIGHTS
                                        </h3>
                                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                            {bucketsData.geo_insights.map((geo, i) => (
                                                <div key={i} style={{
                                                    padding: 'var(--space-md)',
                                                    borderBottom: i < bucketsData.geo_insights.length - 1 ? '1px solid var(--border-glass-light)' : 'none',
                                                    background: geo.suspicious ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{geo.city}, {geo.state}</div>
                                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{geo.country}</div>
                                                        </div>
                                                        <div>
                                                            {geo.impossible_travel && <span className="badge badge-danger">IMPOSSIBLE TRAVEL</span>}
                                                            {geo.suspicious && !geo.impossible_travel && <span className="badge badge-warning">SUSPICIOUS</span>}
                                                            {!geo.suspicious && <span className="badge badge-success">NORMAL</span>}
                                                        </div>
                                                    </div>
                                                    {geo.reason && (
                                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--danger)', marginTop: 'var(--space-xs)' }}>
                                                            ⚠️ {geo.reason}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 5. IP & VPN Analysis */}
                                <div style={{ marginBottom: 'var(--space-xl)' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 600, letterSpacing: '1px' }}>
                                        <Wifi size={16} /> IP & VPN DETECTION
                                    </h3>
                                    <div className="grid grid-cols-4" style={{ gap: 'var(--space-md)' }}>
                                        {bucketsData.ip_vpn_analysis.map((ip, i) => (
                                            <div key={i} className="glass-card" style={{
                                                padding: 'var(--space-md)',
                                                background: ip.risk_score >= 70 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                                borderColor: ip.risk_score >= 70 ? 'rgba(239, 68, 68, 0.3)' : undefined
                                            }}>
                                                <div style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-sm)' }}>{ip.ip}</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                                                    {ip.vpn_detected && <span className="badge badge-danger">VPN</span>}
                                                    {ip.proxy_detected && <span className="badge badge-warning">PROXY</span>}
                                                    {ip.tor_detected && <span className="badge badge-danger">TOR</span>}
                                                    <span className="badge" style={{ background: 'var(--bg-tertiary)' }}>{ip.ip_type}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                                                    <span style={{ color: 'var(--text-tertiary)' }}>{ip.users_count} user(s)</span>
                                                    <span style={{ color: ip.risk_score >= 70 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 600 }}>Risk: {ip.risk_score}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 6. Fraud Pattern Alerts */}
                                <div>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 600, letterSpacing: '1px' }}>
                                        <AlertTriangle size={16} /> FRAUD PATTERN ALERTS
                                    </h3>
                                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                        {bucketsData.alerts.map((alert, i) => (
                                            <div key={i} style={{
                                                padding: 'var(--space-md)',
                                                borderBottom: i < bucketsData.alerts.length - 1 ? '1px solid var(--border-glass-light)' : 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-md)',
                                                background: alert.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                                            }}>
                                                <span className="badge" style={{
                                                    background: alert.severity === 'HIGH' ? 'var(--danger-light)' : alert.severity === 'MEDIUM' ? 'var(--warning-light)' : 'var(--success-light)',
                                                    color: alert.severity === 'HIGH' ? 'var(--danger)' : alert.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--success)',
                                                    minWidth: '60px',
                                                    textAlign: 'center'
                                                }}>{alert.severity}</span>
                                                <div style={{ flex: 1, fontSize: 'var(--font-size-sm)' }}>{alert.message}</div>
                                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>×{alert.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                No data available. Click "Start Buckets" to analyze.
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )
            }
        </>
    );
};

export default FraudOperations;
