import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Plus,
    X,
    Search,
    Sparkles,
    RefreshCw,
    Download,
    ChevronDown
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Types
interface Holding {
    id: string;
    symbol: string;
    name: string;
    type: 'STOCK' | 'CRYPTO' | 'ETF' | 'BOND';
    price: number;
    holdings: number;
    value: number;
    change: number;
    color: string;
}

interface ChartPoint {
    date: string;
    price: number;
}

interface Prediction {
    day: number;
    predicted: number;
    low: number;
    high: number;
}

interface PredictionResult {
    symbol: string;
    currentPrice: number;
    predictions: Prediction[];
    predictedChange: number;
    confidence: number;
    trend: 'bullish' | 'bearish';
}

// Mock holdings data with Indian stocks
const INITIAL_HOLDINGS: Holding[] = [
    { id: '1', symbol: 'RELIANCE', name: 'Reliance Industries', type: 'STOCK', price: 1285.50, holdings: 10, value: 12855, change: 1.28, color: '#6366f1' },
    { id: '2', symbol: 'TCS', name: 'Tata Consultancy', type: 'STOCK', price: 3842.30, holdings: 5, value: 19211.5, change: -0.85, color: '#10b981' },
    { id: '3', symbol: 'INFY', name: 'Infosys', type: 'STOCK', price: 1523.75, holdings: 15, value: 22856.25, change: 2.15, color: '#f59e0b' },
    { id: '4', symbol: 'HDFC', name: 'HDFC Bank', type: 'STOCK', price: 1620.40, holdings: 8, value: 12963.2, change: 0.45, color: '#ef4444' },
];

// Indian stocks for search
const INDIAN_STOCKS = [
    { symbol: 'RELIANCE', name: 'Reliance Industries' },
    { symbol: 'TCS', name: 'Tata Consultancy Services' },
    { symbol: 'INFY', name: 'Infosys' },
    { symbol: 'HDFC', name: 'HDFC Bank' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank' },
    { symbol: 'SBIN', name: 'State Bank of India' },
    { symbol: 'WIPRO', name: 'Wipro' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
    { symbol: 'HCLTECH', name: 'HCL Technologies' },
    { symbol: 'TATASTEEL', name: 'Tata Steel' },
];

const Investments = () => {
    const [holdings, setHoldings] = useState<Holding[]>(INITIAL_HOLDINGS);
    const [selectedStock, setSelectedStock] = useState('RELIANCE');
    const [chartPeriod, setChartPeriod] = useState('1M');
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [predictionData, setPredictionData] = useState<ChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showPrediction, setShowPrediction] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [priceChange, setPriceChange] = useState(0);
    const [priceChangePercent, setPriceChangePercent] = useState(0);

    // Calculate totals
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalPnL = holdings.reduce((sum, h) => sum + (h.value * h.change / 100), 0);
    const pnlPercent = totalValue > totalPnL ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

    // Performance metrics
    const sortedByChange = [...holdings].sort((a, b) => b.change - a.change);
    const bestPerformer = sortedByChange[0];
    const worstPerformer = sortedByChange[sortedByChange.length - 1];

    useEffect(() => {
        fetchChartData();
    }, [selectedStock, chartPeriod]);

    const fetchChartData = async () => {
        setIsLoading(true);
        setShowPrediction(false);
        setPredictionData([]);

        try {
            const response = await fetch(
                `http://localhost:5000/api/stocks/${selectedStock}/chart?period=${chartPeriod}`
            );
            if (response.ok) {
                const result = await response.json();
                const data = result.data || [];
                if (data.length > 0) {
                    setChartData(data);
                    const lastPrice = data[data.length - 1].price;
                    const firstPrice = data[0].price;
                    setCurrentPrice(lastPrice);
                    setPriceChange(lastPrice - firstPrice);
                    setPriceChangePercent(((lastPrice - firstPrice) / firstPrice) * 100);
                } else {
                    generateMockChart();
                }
            } else {
                generateMockChart();
            }
        } catch {
            generateMockChart();
        } finally {
            setIsLoading(false);
        }
    };

    const generateMockChart = () => {
        const days = { '1D': 24, '1W': 7, '1M': 30, '3M': 90, '1Y': 365 }[chartPeriod] || 30;
        const data: ChartPoint[] = [];
        let price = 1300 + Math.random() * 200;

        for (let i = 0; i < days; i++) {
            price += (Math.random() - 0.48) * 20;
            const date = new Date();
            date.setDate(date.getDate() - (days - i));
            data.push({
                date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                price: Math.round(price * 100) / 100
            });
        }
        setChartData(data);
        setCurrentPrice(price);
        setPriceChange(price - data[0].price);
        setPriceChangePercent(((price - data[0].price) / data[0].price) * 100);
    };

    const handlePredict = async () => {
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/stocks/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: selectedStock, days: 7 })
            });

            if (response.ok) {
                const data = await response.json();
                setPrediction(data);

                // Create prediction data for chart (green line extension)
                const predPoints: ChartPoint[] = data.predictions.map((p: Prediction) => {
                    const futureDate = new Date();
                    futureDate.setDate(futureDate.getDate() + p.day);
                    return {
                        date: futureDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                        price: p.predicted
                    };
                });

                setPredictionData(predPoints);
                setShowPrediction(true);
            } else {
                throw new Error('API failed');
            }
        } catch {
            // Mock prediction
            const mockPreds: ChartPoint[] = [];
            let pred = currentPrice;
            for (let i = 1; i <= 7; i++) {
                pred *= (1 + (Math.random() - 0.45) * 0.025);
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + i);
                mockPreds.push({
                    date: futureDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                    price: Math.round(pred * 100) / 100
                });
            }
            setPredictionData(mockPreds);
            setShowPrediction(true);
            setPrediction({
                symbol: selectedStock,
                currentPrice,
                predictions: mockPreds.map((p, i) => ({ day: i + 1, predicted: p.price, low: p.price * 0.97, high: p.price * 1.03 })),
                predictedChange: ((mockPreds[6].price - currentPrice) / currentPrice) * 100,
                confidence: 72.5,
                trend: mockPreds[6].price > currentPrice ? 'bullish' : 'bearish'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Prepare chart labels and data
    const allLabels = [...chartData.map(d => d.date)];
    const historicalPrices = chartData.map(d => d.price);
    let predictedPrices: (number | null)[] = [];

    if (showPrediction && predictionData.length > 0) {
        // Add prediction labels
        predictionData.forEach(p => allLabels.push(p.date));

        // Historical line: actual data + last point to connect
        // Prediction line: null for historical, then predictions
        predictedPrices = Array(chartData.length - 1).fill(null);
        predictedPrices.push(currentPrice); // Connect from last historical point
        predictionData.forEach(p => predictedPrices.push(p.price));
    }

    // Chart.js configuration with prediction line
    const chartConfig = {
        labels: allLabels,
        datasets: [
            {
                label: 'Historical Price',
                data: showPrediction
                    ? [...historicalPrices, ...Array(predictionData.length).fill(null)]
                    : historicalPrices,
                borderColor: '#00b8d4',
                backgroundColor: 'rgba(0, 184, 212, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderWidth: 2,
            },
            ...(showPrediction ? [{
                label: 'AI Prediction',
                data: predictedPrices,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#10b981',
                borderWidth: 3,
                borderDash: [8, 4],
            }] : []),
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: showPrediction,
                position: 'top' as const,
                labels: { color: '#999' }
            },
            tooltip: {
                backgroundColor: '#1a1a2e',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#333',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#666', maxTicksLimit: 10 }
            },
            y: {
                grid: { color: '#222' },
                ticks: { color: '#666' }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index' as const
        }
    } as const;

    const filteredStocks = INDIAN_STOCKS.filter(s =>
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="investments-page">
            {/* Header Stats */}
            <div className="investments-header">
                <div className="stat-card stat-total">
                    <div className="stat-label">TOTAL VALUE</div>
                    <div className="stat-value">₹{(totalValue / 1000).toFixed(1)}K</div>
                    <div className="stat-meta">
                        <span className="stat-badge">{holdings.length} assets</span>
                    </div>
                </div>
                <div className="stat-card stat-pnl">
                    <div className="stat-label">TOTAL P&L</div>
                    <div className={`stat-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
                        {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(0)}
                    </div>
                    <div className="stat-meta">
                        <span className={totalPnL >= 0 ? 'positive' : 'negative'}>
                            {pnlPercent >= 0 ? '↑' : '↓'} {Math.abs(pnlPercent).toFixed(1)}%
                        </span>
                    </div>
                </div>
                <div className="stat-card stat-holdings">
                    <div className="stat-label">HOLDINGS</div>
                    <div className="stat-value">{holdings.length}</div>
                    <div className="stat-dots">
                        {holdings.slice(0, 3).map(h => (
                            <span key={h.id} className="dot" style={{ background: h.color }}></span>
                        ))}
                    </div>
                </div>
                <div className="stat-card stat-health">
                    <div className="stat-label">HEALTH</div>
                    <div className="stat-value health-excellent">Excellent</div>
                </div>
            </div>

            <div className="investments-content">
                {/* Chart Section */}
                <div className="chart-section">
                    <div className="chart-header">
                        <div className="chart-title">
                            <Sparkles size={18} className="sparkle-icon" />
                            <span>Price Chart</span>
                            {showPrediction && prediction && (
                                <span className={`prediction-badge ${prediction.trend}`}>
                                    {prediction.trend === 'bullish' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {prediction.predictedChange >= 0 ? '+' : ''}{prediction.predictedChange.toFixed(1)}% ({prediction.confidence}% conf)
                                </span>
                            )}
                        </div>
                        <div className="chart-controls">
                            <button
                                className={`ai-predict-btn ${showPrediction ? 'active' : ''}`}
                                onClick={handlePredict}
                                disabled={isLoading}
                            >
                                <Sparkles size={14} />
                                {showPrediction ? 'Hide Prediction' : 'AI Predict'}
                            </button>
                            {['1D', '1W', '1M', '3M', '1Y'].map(period => (
                                <button
                                    key={period}
                                    className={`period-btn ${chartPeriod === period ? 'active' : ''}`}
                                    onClick={() => setChartPeriod(period)}
                                >
                                    {period}
                                </button>
                            ))}
                            <div className="stock-selector">
                                <button
                                    className="stock-dropdown-btn"
                                    onClick={() => setStockDropdownOpen(!stockDropdownOpen)}
                                >
                                    <span className="stock-dot"></span>
                                    {selectedStock}
                                    <ChevronDown size={14} />
                                </button>
                                {stockDropdownOpen && (
                                    <div className="stock-dropdown">
                                        <input
                                            type="text"
                                            placeholder="Search stocks..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="stock-search"
                                        />
                                        {filteredStocks.map(stock => (
                                            <button
                                                key={stock.symbol}
                                                className="stock-option"
                                                onClick={() => {
                                                    setSelectedStock(stock.symbol);
                                                    setStockDropdownOpen(false);
                                                    setSearchQuery('');
                                                    setShowPrediction(false);
                                                }}
                                            >
                                                <span className="stock-symbol">{stock.symbol}</span>
                                                <span className="stock-name">{stock.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="stock-info">
                        <h2 className="stock-symbol-large">{selectedStock}</h2>
                        <span className="stock-company">
                            {INDIAN_STOCKS.find(s => s.symbol === selectedStock)?.name || selectedStock}
                        </span>
                    </div>

                    <div className="price-info">
                        <span className="current-price">₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        <span className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
                            {priceChange >= 0 ? '↗' : '↘'} ₹{Math.abs(priceChange).toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                        </span>
                    </div>

                    <div className="chart-container">
                        {isLoading ? (
                            <div className="chart-loading">
                                <RefreshCw className="spin" size={24} />
                                <span>Loading...</span>
                            </div>
                        ) : (
                            <Line data={chartConfig} options={chartOptions} />
                        )}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="right-panel">
                    {/* Holdings Table */}
                    <div className="holdings-section">
                        <div className="holdings-header">
                            <h3>Holdings</h3>
                            <button className="add-asset-btn" onClick={() => setShowAddModal(true)}>
                                <Plus size={16} />
                                Add
                            </button>
                        </div>

                        <div className="holdings-table">
                            <div className="table-header">
                                <span>ASSET</span>
                                <span>PRICE</span>
                                <span>VALUE</span>
                                <span>%</span>
                            </div>
                            {holdings.map(holding => (
                                <div key={holding.id} className="table-row">
                                    <div className="asset-cell">
                                        <div className="asset-icon" style={{ background: holding.color }}>
                                            {holding.symbol.slice(0, 2)}
                                        </div>
                                        <div className="asset-info">
                                            <span className="asset-name">{holding.symbol}</span>
                                            <span className="asset-type">{holding.holdings} qty</span>
                                        </div>
                                    </div>
                                    <span className="price-cell">₹{holding.price.toLocaleString()}</span>
                                    <span className="value-cell">₹{holding.value.toLocaleString()}</span>
                                    <span className={`change-cell ${holding.change >= 0 ? 'positive' : 'negative'}`}>
                                        {holding.change >= 0 ? '+' : ''}{holding.change}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="metrics-section">
                        <h3>Performance</h3>
                        <div className="metric-row">
                            <span className="metric-label">Best</span>
                            <span className="metric-value positive">
                                {bestPerformer.symbol} +{bestPerformer.change}%
                            </span>
                        </div>
                        <div className="metric-row">
                            <span className="metric-label">Worst</span>
                            <span className="metric-value negative">
                                {worstPerformer.symbol} {worstPerformer.change}%
                            </span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="actions-section">
                        <button className="action-btn primary">Rebalance Portfolio</button>
                        <button className="action-btn secondary">
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Asset Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            className="add-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2><Plus size={20} /> Add Asset</h2>
                                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="add-form">
                                <div className="search-box">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search stocks..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="search-results">
                                    {filteredStocks.map(stock => (
                                        <button
                                            key={stock.symbol}
                                            className="search-result"
                                            onClick={() => {
                                                const newHolding: Holding = {
                                                    id: Date.now().toString(),
                                                    symbol: stock.symbol,
                                                    name: stock.name,
                                                    type: 'STOCK',
                                                    price: Math.random() * 2000 + 500,
                                                    holdings: 10,
                                                    value: 0,
                                                    change: Math.random() * 6 - 2,
                                                    color: `hsl(${Math.random() * 360}, 70%, 50%)`
                                                };
                                                newHolding.value = newHolding.price * newHolding.holdings;
                                                setHoldings([...holdings, newHolding]);
                                                setShowAddModal(false);
                                                setSearchQuery('');
                                            }}
                                        >
                                            <div className="result-icon">{stock.symbol.slice(0, 2)}</div>
                                            <div className="result-info">
                                                <span className="result-name">{stock.name}</span>
                                                <span className="result-symbol">{stock.symbol} • NSE</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Investments;
