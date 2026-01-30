import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator,
    Play,
    BarChart3,
    Sliders,
    ChevronDown,
    Wallet,
    Home,
    Car,
    CreditCard,
    PiggyBank,
    TrendingUp,
    Receipt,
    Target,
    Percent,
    Download,
    FileText,
    Copy,
    Check,
    X
} from 'lucide-react';

interface Variable {
    name: string;
    value: number | string;
    label: string;
    type?: 'number' | 'select';
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
}

interface ResultRow {
    [key: string]: number | string | undefined;
}

interface CalculationResult {
    [key: string]: string | number | boolean | ResultRow[] | undefined;
    yearlyBreakdown?: ResultRow[];
    breakdown?: ResultRow[];
    error?: string;
    method?: string;
    formula?: string;
    note?: string;
    warning?: string;
    recommendation?: string;
    insight?: string;
}

// All calculators grouped by category
const CALCULATOR_CATEGORIES = [
    {
        name: '💰 Savings & Investments',
        calculators: [
            { id: 'sip', name: 'SIP Calculator', icon: TrendingUp },
            { id: 'lumpsum', name: 'Lumpsum Investment', icon: Wallet },
            { id: 'ppf', name: 'PPF (15 Year)', icon: PiggyBank },
            { id: 'nps', name: 'NPS Retirement', icon: Target },
            { id: 'simple_interest', name: 'Simple Interest', icon: Percent },
            { id: 'compound_interest', name: 'Compound Interest', icon: TrendingUp },
        ]
    },
    {
        name: '🏦 Loans & EMI',
        calculators: [
            { id: 'home_loan', name: 'Home Loan EMI', icon: Home },
            { id: 'car_loan', name: 'Car Loan EMI', icon: Car },
            { id: 'personal_loan', name: 'Personal Loan', icon: Wallet },
            { id: 'gold_loan', name: 'Gold Loan', icon: Receipt },
            { id: 'emi', name: 'General EMI', icon: Calculator },
        ]
    },
    {
        name: '🏢 Fixed Income',
        calculators: [
            { id: 'fd', name: 'Fixed Deposit', icon: PiggyBank },
            { id: 'rd', name: 'Recurring Deposit', icon: PiggyBank },
            { id: 'ssy', name: 'Sukanya Samriddhi', icon: Target },
        ]
    },
    {
        name: '💳 Debt & Credit',
        calculators: [
            { id: 'credit_card', name: 'Credit Card Interest', icon: CreditCard },
            { id: 'debt_payoff', name: 'Debt Payoff Planner', icon: Target },
        ]
    },
    {
        name: '📊 Tax & Goals',
        calculators: [
            { id: 'tax', name: 'Income Tax', icon: Receipt },
            { id: 'hra', name: 'HRA Exemption', icon: Home },
            { id: 'savings_goal', name: 'Goal Planner', icon: Target },
            { id: 'inflation', name: 'Inflation Calculator', icon: Percent },
            { id: 'monte_carlo', name: 'Monte Carlo Sim', icon: BarChart3 },
        ]
    },
];

const DEFAULT_VARIABLES: Record<string, Variable[]> = {
    sip: [
        { name: 'monthly_invest', value: 25000, label: 'Monthly Investment (₹)', min: 500, max: 500000, step: 500 },
        { name: 'rate', value: 12, label: 'Expected Return (%)', min: 1, max: 30, step: 0.5 },
        { name: 'years', value: 20, label: 'Time Period (Years)', min: 1, max: 40, step: 1 },
        { name: 'step_up', value: 10, label: 'Annual Step-Up (%)', min: 0, max: 25, step: 1 },
        { name: 'inflation', value: 6, label: 'Inflation (%)', min: 0, max: 15, step: 0.5 },
    ],
    lumpsum: [
        { name: 'principal', value: 500000, label: 'Investment Amount (₹)', min: 1000, max: 100000000, step: 10000 },
        { name: 'rate', value: 12, label: 'Expected Return (%)', min: 1, max: 30, step: 0.5 },
        { name: 'years', value: 10, label: 'Time Period (Years)', min: 1, max: 40, step: 1 },
    ],
    ppf: [
        { name: 'yearly_invest', value: 150000, label: 'Yearly Investment (₹)', min: 500, max: 150000, step: 1000 },
        { name: 'years', value: 15, label: 'Time Period (Years)', min: 15, max: 50, step: 1 },
    ],
    nps: [
        { name: 'monthly_invest', value: 10000, label: 'Monthly Investment (₹)', min: 500, max: 200000, step: 500 },
        { name: 'years', value: 25, label: 'Years to Retirement', min: 1, max: 40, step: 1 },
        { name: 'equity_percent', value: 50, label: 'Equity Allocation (%)', min: 0, max: 75, step: 5 },
    ],
    simple_interest: [
        { name: 'principal', value: 100000, label: 'Principal (₹)', min: 1000, max: 10000000, step: 10000 },
        { name: 'rate', value: 7, label: 'Interest Rate (%)', min: 1, max: 30, step: 0.5 },
        { name: 'years', value: 5, label: 'Time Period (Years)', min: 1, max: 40, step: 1 },
    ],
    compound_interest: [
        { name: 'principal', value: 100000, label: 'Principal (₹)', min: 1000, max: 10000000, step: 10000 },
        { name: 'rate', value: 10, label: 'Interest Rate (%)', min: 1, max: 30, step: 0.5 },
        { name: 'years', value: 10, label: 'Time Period (Years)', min: 1, max: 40, step: 1 },
        { name: 'compounds_per_year', value: 12, label: 'Compounds/Year', min: 1, max: 365, step: 1 },
    ],
    home_loan: [
        { name: 'principal', value: 5000000, label: 'Loan Amount (₹)', min: 100000, max: 100000000, step: 100000 },
        { name: 'rate', value: 8.5, label: 'Interest Rate (%)', min: 6, max: 15, step: 0.1 },
        { name: 'years', value: 20, label: 'Loan Tenure (Years)', min: 1, max: 30, step: 1 },
    ],
    car_loan: [
        { name: 'principal', value: 800000, label: 'Car Price (₹)', min: 100000, max: 50000000, step: 50000 },
        { name: 'rate', value: 9, label: 'Interest Rate (%)', min: 7, max: 18, step: 0.1 },
        { name: 'years', value: 5, label: 'Loan Tenure (Years)', min: 1, max: 7, step: 1 },
        { name: 'down_payment_percent', value: 20, label: 'Down Payment (%)', min: 0, max: 50, step: 5 },
    ],
    personal_loan: [
        { name: 'principal', value: 300000, label: 'Loan Amount (₹)', min: 10000, max: 5000000, step: 10000 },
        { name: 'rate', value: 14, label: 'Interest Rate (%)', min: 10, max: 24, step: 0.5 },
        { name: 'years', value: 3, label: 'Loan Tenure (Years)', min: 1, max: 7, step: 1 },
    ],
    gold_loan: [
        { name: 'gold_value', value: 500000, label: 'Gold Value (₹)', min: 10000, max: 50000000, step: 10000 },
        { name: 'ltv_percent', value: 75, label: 'LTV (%)', min: 50, max: 90, step: 5 },
        { name: 'rate', value: 7.5, label: 'Interest Rate (%)', min: 7, max: 15, step: 0.5 },
        { name: 'months', value: 12, label: 'Tenure (Months)', min: 3, max: 36, step: 3 },
    ],
    emi: [
        { name: 'principal', value: 1000000, label: 'Loan Amount (₹)', min: 10000, max: 100000000, step: 10000 },
        { name: 'rate', value: 10, label: 'Interest Rate (%)', min: 1, max: 30, step: 0.5 },
        { name: 'years', value: 5, label: 'Tenure (Years)', min: 1, max: 30, step: 1 },
    ],
    fd: [
        { name: 'principal', value: 500000, label: 'Deposit Amount (₹)', min: 1000, max: 100000000, step: 10000 },
        { name: 'rate', value: 7, label: 'Interest Rate (%)', min: 3, max: 10, step: 0.1 },
        { name: 'years', value: 5, label: 'Tenure (Years)', min: 1, max: 10, step: 1 },
        { name: 'compounding', value: 'quarterly', label: 'Compounding', type: 'select', options: ['monthly', 'quarterly', 'half_yearly', 'yearly'] },
    ],
    rd: [
        { name: 'monthly_deposit', value: 10000, label: 'Monthly Deposit (₹)', min: 100, max: 100000, step: 500 },
        { name: 'rate', value: 6.5, label: 'Interest Rate (%)', min: 3, max: 10, step: 0.1 },
        { name: 'months', value: 60, label: 'Tenure (Months)', min: 6, max: 120, step: 6 },
    ],
    ssy: [
        { name: 'yearly_invest', value: 150000, label: 'Yearly Investment (₹)', min: 250, max: 150000, step: 1000 },
        { name: 'years', value: 21, label: 'Maturity Years', min: 21, max: 21, step: 1 },
    ],
    credit_card: [
        { name: 'outstanding', value: 100000, label: 'Outstanding Balance (₹)', min: 1000, max: 1000000, step: 1000 },
        { name: 'apr', value: 42, label: 'APR (%)', min: 30, max: 48, step: 1 },
        { name: 'monthly_payment', value: 5000, label: 'Monthly Payment (₹)', min: 0, max: 100000, step: 500 },
    ],
    debt_payoff: [
        { name: 'extra_payment', value: 5000, label: 'Extra Monthly Payment (₹)', min: 0, max: 100000, step: 1000 },
        { name: 'strategy', value: 'avalanche', label: 'Strategy', type: 'select', options: ['avalanche', 'snowball'] },
    ],
    tax: [
        { name: 'income', value: 1500000, label: 'Annual Income (₹)', min: 100000, max: 100000000, step: 50000 },
        { name: 'deductions', value: 150000, label: 'Deductions - 80C (₹)', min: 0, max: 500000, step: 10000 },
        { name: 'regime', value: 'new', label: 'Tax Regime', type: 'select', options: ['new', 'old'] },
    ],
    hra: [
        { name: 'basic_salary', value: 50000, label: 'Basic Salary (₹/month)', min: 10000, max: 500000, step: 5000 },
        { name: 'hra_received', value: 20000, label: 'HRA Received (₹/month)', min: 0, max: 200000, step: 1000 },
        { name: 'rent_paid', value: 25000, label: 'Rent Paid (₹/month)', min: 0, max: 200000, step: 1000 },
        { name: 'metro_city', value: 1, label: 'Metro City?', min: 0, max: 1, step: 1 },
    ],
    savings_goal: [
        { name: 'target', value: 10000000, label: 'Target Amount (₹)', min: 100000, max: 1000000000, step: 100000 },
        { name: 'years', value: 15, label: 'Time to Goal (Years)', min: 1, max: 40, step: 1 },
        { name: 'rate', value: 12, label: 'Expected Return (%)', min: 1, max: 30, step: 0.5 },
    ],
    inflation: [
        { name: 'amount', value: 100000, label: 'Current Amount (₹)', min: 1000, max: 100000000, step: 10000 },
        { name: 'years', value: 20, label: 'Years', min: 1, max: 50, step: 1 },
        { name: 'inflation_rate', value: 6, label: 'Inflation Rate (%)', min: 2, max: 15, step: 0.5 },
    ],
    monte_carlo: [
        { name: 'initial_investment', value: 100000, label: 'Initial Investment (₹)', min: 0, max: 100000000, step: 10000 },
        { name: 'monthly_contribution', value: 10000, label: 'Monthly Contribution (₹)', min: 0, max: 500000, step: 1000 },
        { name: 'years', value: 20, label: 'Years', min: 1, max: 40, step: 1 },
        { name: 'expected_return', value: 12, label: 'Expected Return (%)', min: 5, max: 20, step: 1 },
        { name: 'volatility', value: 15, label: 'Volatility (%)', min: 5, max: 30, step: 1 },
    ],
};

const Terminal = () => {
    const [activeCalc, setActiveCalc] = useState('sip');
    const [variables, setVariables] = useState<Variable[]>(DEFAULT_VARIABLES.sip);
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [tableData, setTableData] = useState<ResultRow[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [showVariables, setShowVariables] = useState(true);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showSensitivity, setShowSensitivity] = useState(false);
    const [sensitivityData, setSensitivityData] = useState<{ variable: string, results: { change: string, value: number }[] }[]>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleAICommand = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { action, variable, value } = customEvent.detail;
            if (action === 'set_variable' && variable && value !== undefined) {
                setVariables(prev => prev.map(v =>
                    v.name === variable ? { ...v, value: Number(value) } : v
                ));
            } else if (action === 'run_model') {
                runCalculation();
            }
        };
        window.addEventListener('ai-command', handleAICommand);
        return () => window.removeEventListener('ai-command', handleAICommand);
    }, [variables]);

    useEffect(() => {
        setVariables(DEFAULT_VARIABLES[activeCalc] || DEFAULT_VARIABLES.sip);
        setResult(null);
        setTableData([]);
    }, [activeCalc]);

    const handleVariableChange = (name: string, value: number | string) => {
        setVariables(prev => prev.map(v =>
            v.name === name ? { ...v, value } : v
        ));
    };

    const runCalculation = async () => {
        setIsCalculating(true);

        const params: Record<string, number | string | boolean> = {};
        variables.forEach(v => {
            if (v.name === 'metro_city') {
                params[v.name] = Number(v.value) === 1;
            } else if (v.type === 'select') {
                params[v.name] = v.value;
            } else {
                params[v.name] = Number(v.value);
            }
        });

        try {
            const response = await fetch('http://localhost:5000/api/terminal/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: activeCalc, params }),
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data);
                const breakdown = data.yearlyBreakdown || data.breakdown || [];
                setTableData(breakdown);
            }
        } catch (err) {
            console.error('Calculation failed', err);
            setResult({ error: 'Backend not running. Start with: python app.py' });
        } finally {
            setIsCalculating(false);
        }
    };

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    const getActiveCalcName = () => {
        for (const cat of CALCULATOR_CATEGORIES) {
            const calc = cat.calculators.find(c => c.id === activeCalc);
            if (calc) return calc.name;
        }
        return 'Calculator';
    };

    // Export to CSV
    const exportToCSV = () => {
        if (!result || tableData.length === 0) return;

        const headers = Object.keys(tableData[0]).join(',');
        const rows = tableData.map(row => Object.values(row).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finova-${activeCalc}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    // Export to JSON
    const exportToJSON = () => {
        if (!result) return;

        const data = {
            calculator: activeCalc,
            calculatorName: getActiveCalcName(),
            date: new Date().toISOString(),
            variables: variables.reduce((acc, v) => ({ ...acc, [v.name]: v.value }), {}),
            result,
            breakdown: tableData
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finova-${activeCalc}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    // Copy results to clipboard
    const copyResults = async () => {
        if (!result) return;

        let text = `📊 ${getActiveCalcName()} Results\n\n`;
        text += `Variables:\n`;
        variables.forEach(v => {
            text += `  ${v.label}: ${v.value}\n`;
        });
        text += `\nResults:\n`;
        Object.entries(result).filter(([key]) =>
            !['yearlyBreakdown', 'breakdown', 'formula', 'method', 'note', 'warning', 'recommendation', 'insight'].includes(key)
            && typeof result[key] === 'number'
        ).forEach(([key, val]) => {
            text += `  ${key.replace(/([A-Z])/g, ' $1').trim()}: ${typeof val === 'number' ? formatCurrency(val) : val}\n`;
        });

        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setShowExportMenu(false);
    };

    // Run Sensitivity Analysis
    const runSensitivityAnalysis = async () => {
        if (!result) {
            await runCalculation();
        }

        const numericVars = variables.filter(v => v.type !== 'select');
        const results: { variable: string, results: { change: string, value: number }[] }[] = [];

        for (const variable of numericVars.slice(0, 3)) { // Analyze top 3 variables
            const baseValue = Number(variable.value);
            const variations = [
                { change: '-20%', factor: 0.8 },
                { change: '-10%', factor: 0.9 },
                { change: 'Base', factor: 1.0 },
                { change: '+10%', factor: 1.1 },
                { change: '+20%', factor: 1.2 }
            ];

            const varResults: { change: string, value: number }[] = [];

            for (const v of variations) {
                const testValue = Math.round(baseValue * v.factor);
                const params: Record<string, number | string | boolean> = {};
                variables.forEach(vb => {
                    if (vb.name === variable.name) {
                        params[vb.name] = testValue;
                    } else if (vb.name === 'metro_city') {
                        params[vb.name] = Number(vb.value) === 1;
                    } else if (vb.type === 'select') {
                        params[vb.name] = vb.value;
                    } else {
                        params[vb.name] = Number(vb.value);
                    }
                });

                try {
                    const response = await fetch('http://localhost:5000/api/terminal/calculate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: activeCalc, params }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const mainValue = Object.entries(data).find(([key]) =>
                            key.toLowerCase().includes('value') || key.toLowerCase().includes('corpus') || key.toLowerCase().includes('total')
                        );
                        varResults.push({ change: v.change, value: mainValue ? Number(mainValue[1]) : 0 });
                    }
                } catch {
                    varResults.push({ change: v.change, value: 0 });
                }
            }

            results.push({ variable: variable.label, results: varResults });
        }

        setSensitivityData(results);
        setShowSensitivity(true);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            className="terminal-page"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="terminal-header" variants={itemVariants}>
                <div className="terminal-title">
                    <Calculator size={24} />
                    <div>
                        <h1>Quantitative Terminal</h1>
                        <span className="terminal-subtitle">Financial Modeling Sandbox • {getActiveCalcName()}</span>
                    </div>
                </div>
                <div className="terminal-actions">
                    {/* Export dropdown */}
                    <div className="export-dropdown-container" style={{ position: 'relative' }}>
                        <button
                            className="terminal-btn"
                            title="Export Results"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={!result}
                        >
                            <Download size={16} />
                            Export
                        </button>
                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    className="export-dropdown"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '4px',
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        minWidth: '160px',
                                        zIndex: 100
                                    }}
                                >
                                    <button onClick={exportToCSV} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}>
                                        <FileText size={14} /> Export CSV
                                    </button>
                                    <button onClick={exportToJSON} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}>
                                        <FileText size={14} /> Export JSON
                                    </button>
                                    <button onClick={copyResults} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}>
                                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy Results'}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button
                        className="terminal-btn"
                        title="Sensitivity Analysis"
                        onClick={runSensitivityAnalysis}
                        disabled={isCalculating}
                    >
                        <Sliders size={16} />
                        Sensitivity
                    </button>
                    <button
                        className="terminal-btn accent"
                        title="Monte Carlo Simulation"
                        onClick={() => setActiveCalc('monte_carlo')}
                    >
                        <BarChart3 size={16} />
                        Monte Carlo
                    </button>
                    <button
                        className="terminal-btn primary"
                        onClick={runCalculation}
                        disabled={isCalculating}
                    >
                        <Play size={16} />
                        {isCalculating ? 'Running...' : 'Run Model'}
                    </button>
                </div>
            </motion.div>

            {/* Sensitivity Analysis Modal */}
            <AnimatePresence>
                {showSensitivity && (
                    <motion.div
                        className="sensitivity-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSensitivity(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <motion.div
                            className="sensitivity-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '16px',
                                padding: '24px',
                                minWidth: '600px',
                                maxHeight: '80vh',
                                overflow: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>📊 Sensitivity Analysis</h2>
                                <button onClick={() => setShowSensitivity(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                                How results change when varying each parameter by ±10% and ±20%
                            </p>
                            {sensitivityData.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Running sensitivity analysis...</p>
                            ) : (
                                sensitivityData.map((item, idx) => (
                                    <div key={idx} style={{ marginBottom: '24px' }}>
                                        <h4 style={{ color: 'var(--accent-primary)', marginBottom: '8px' }}>{item.variable}</h4>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    {item.results.map((r, i) => (
                                                        <th key={i} style={{ padding: '8px', background: r.change === 'Base' ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                                                            {r.change}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    {item.results.map((r, i) => (
                                                        <td key={i} style={{ padding: '8px', textAlign: 'center', color: 'var(--text-primary)' }}>
                                                            {formatCurrency(r.value)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="terminal-body">
                <motion.div className="terminal-sidebar" variants={itemVariants}>
                    {CALCULATOR_CATEGORIES.map(category => (
                        <div key={category.name} className="calc-category">
                            <div className="calc-category-title">{category.name}</div>
                            {category.calculators.map(calc => (
                                <button
                                    key={calc.id}
                                    className={`calc-item ${activeCalc === calc.id ? 'active' : ''}`}
                                    onClick={() => setActiveCalc(calc.id)}
                                >
                                    <calc.icon size={16} />
                                    <span className="calc-name">{calc.name}</span>
                                </button>
                            ))}
                        </div>
                    ))}
                </motion.div>

                <motion.div className="terminal-variables" variants={itemVariants}>
                    <div className="panel-header" onClick={() => setShowVariables(!showVariables)}>
                        <span>Variables</span>
                        <ChevronDown className={`chevron ${showVariables ? 'open' : ''}`} size={16} />
                    </div>

                    {showVariables && (
                        <div className="variables-list">
                            {variables.map(v => (
                                <div key={v.name} className="variable-item">
                                    <label className="variable-label">
                                        <span className="var-prefix">#</span>
                                        {v.name}
                                    </label>
                                    <div className="variable-input-wrapper">
                                        <span className="var-equals">=</span>
                                        {v.type === 'select' ? (
                                            <select
                                                value={v.value}
                                                onChange={(e) => handleVariableChange(v.name, e.target.value)}
                                                className="variable-input"
                                            >
                                                {v.options?.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="number"
                                                value={v.value}
                                                min={v.min}
                                                max={v.max}
                                                step={v.step}
                                                onChange={(e) => handleVariableChange(v.name, Number(e.target.value))}
                                                className="variable-input"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div className="terminal-results" variants={itemVariants}>
                    {result?.error && (
                        <div className="results-error">
                            ⚠️ {result.error}
                        </div>
                    )}

                    {!result && (
                        <div className="results-placeholder">
                            <Play size={48} strokeWidth={1} />
                            <p>Run your model to see projections</p>
                            <span>Press Ctrl+Enter or click "Run Model"</span>
                        </div>
                    )}

                    {result && !result.error && (
                        <div className="results-content">
                            <div className="results-summary">
                                {Object.entries(result).filter(([key]) =>
                                    !['yearlyBreakdown', 'breakdown', 'formula', 'method', 'note', 'warning', 'recommendation', 'insight'].includes(key)
                                    && typeof result[key] === 'number'
                                ).slice(0, 6).map(([key, value]) => (
                                    <div key={key} className="summary-card">
                                        <span className="summary-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className={`summary-value ${key.includes('Tax') || key.includes('Interest') ? 'danger' : key.includes('Gains') || key.includes('Value') || key.includes('Corpus') ? 'success' : 'accent'}`}>
                                            {typeof value === 'number' ? formatCurrency(value) : String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {result.method && (
                                <div className="result-method">
                                    <strong>Method:</strong> {result.method}
                                    {result.formula && <span> | <strong>Formula:</strong> {result.formula}</span>}
                                </div>
                            )}

                            {(result.note || result.warning || result.recommendation || result.insight) && (
                                <div className={`result-note ${result.warning ? 'warning' : ''}`}>
                                    {result.warning ?? result.note ?? result.recommendation ?? result.insight}
                                </div>
                            )}

                            {tableData.length > 0 && (
                                <div className="results-table-container">
                                    <table className="results-table">
                                        <thead>
                                            <tr>
                                                {Object.keys(tableData[0]).map(key => (
                                                    <th key={key}>{key.replace(/([A-Z])/g, ' $1').trim()}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableData.map((row, i) => (
                                                <tr key={i}>
                                                    {Object.values(row).map((val, j) => (
                                                        <td key={j} className={typeof val === 'number' && val > 0 ? 'positive' : ''}>
                                                            {typeof val === 'number'
                                                                ? (val > 1000 ? formatCurrency(val) : val.toFixed(2))
                                                                : String(val ?? '-')
                                                            }
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            <div className="terminal-footer">
                <div className="terminal-status">
                    <span className="status-dot online"></span>
                    VISNOVA QUANT
                </div>
                <span className="terminal-version">v2.3</span>
                <span className="terminal-module">Module: {activeCalc.toUpperCase()}</span>
                <span className="terminal-hint">Ctrl+Enter to Run</span>
            </div>
        </motion.div>
    );
};

export default Terminal;
