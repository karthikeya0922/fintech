import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Plus,
    Sparkles,
    RefreshCw,
    ChevronDown,
    ShieldCheck,
    Activity
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

// ============================================
// CONSTANTS & TYPES
// ============================================

const getEnv = (key: string) => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env[key] || import.meta.env[`VITE_${key}`];
        }
    } catch (e) { console.warn("Env access error", e); }
    return undefined;
};

const KEYS = {
    FINNHUB: getEnv('FINNHUB_API_KEY'),
    FMP: getEnv('FMP_API_KEY'),
    ALPHAVANTAGE: getEnv('ALPHAVANTAGE_API_KEY')
};

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
    low: number; // Support
    high: number; // Resistance
}

interface PredictionResult {
    symbol: string;
    currentPrice: number;
    predictions: Prediction[];
    predictedChange: number;
    confidence: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    signal: 'BUY' | 'SELL' | 'HOLD';
    source?: string;
    indicators: {
        rsi: number;
        macd: number;
        volatility: number;
        trendStrength?: number;
        sma5?: number;
        sma20?: number;
        momentum?: number;
    };
    lastUpdated: number;
}



interface AggregatedPrice {
    ltp: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    timestamp: number;
    sources: number;
    isCached?: boolean;
}

const INDIAN_STOCKS = [
    { symbol: 'RELIANCE', name: 'Reliance Industries' },
    { symbol: 'TCS', name: 'Tata Consultancy Services' },
    { symbol: 'INFY', name: 'Infosys' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank' },
    { symbol: 'SBIN', name: 'State Bank of India' },
    { symbol: 'WIPRO', name: 'Wipro' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
    { symbol: 'HCLTECH', name: 'HCL Technologies' },
    { symbol: 'TATASTEEL', name: 'Tata Steel' },
    { symbol: 'MARUTI', name: 'Maruti Suzuki' },
    { symbol: 'TITAN', name: 'Titan Company' },
];

const INITIAL_HOLDINGS: Holding[] = [
    { id: '1', symbol: 'RELIANCE', name: 'Reliance Industries', type: 'STOCK', price: 1285.50, holdings: 10, value: 12855, change: 1.28, color: '#6366f1' },
    { id: '2', symbol: 'TCS', name: 'Tata Consultancy', type: 'STOCK', price: 3842.30, holdings: 5, value: 19211.5, change: -0.85, color: '#10b981' },
    { id: '3', symbol: 'INFY', name: 'Infosys', type: 'STOCK', price: 1523.75, holdings: 15, value: 22856.25, change: 2.15, color: '#f59e0b' },
    { id: '4', symbol: 'HDFCBANK', name: 'HDFC Bank', type: 'STOCK', price: 1620.40, holdings: 8, value: 12963.2, change: 0.45, color: '#ef4444' },
];

const normalizeSymbol = (symbol: string) => {
    const base = symbol.replace(/\.(NS|BO)$/i, '').toUpperCase();
    return `${base}.NS`;
};

// ============================================
// ADVANCED TECHNICAL ANALYSIS ENGINE
// ============================================

// SMA: Standard Moving Average
const calculateSMA = (data: number[], period: number) => {
    if (data.length < period) return [];
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
    }
    return sma;
};

// EMA: Exponential Moving Average
const calculateEMA = (data: number[], period: number) => {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    const ema = [data[0]];

    // Seed with first value for simplicity (standard client-side approx)
    for (let i = 1; i < data.length; i++) {
        ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
};

// RSI: Relative Strength Index (14-period)
const calculateRSI = (prices: number[], period = 14) => {
    if (prices.length < period + 1) return 50;

    // Initial Average Gain/Loss
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smoothing step for the rest
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = (avgGain * 13 + gain) / 14;
        avgLoss = (avgLoss * 13 + loss) / 14;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

// MACD: Moving Average Convergence Divergence
const calculateMACD = (prices: number[]) => {
    if (prices.length < 26) return 0;
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);

    // Get last values
    const val12 = ema12[ema12.length - 1];
    const val26 = ema26[ema26.length - 1];
    return val12 - val26;
};

// Volatility: Annualized Standard Deviation
const calculateVolatility = (prices: number[]) => {
    if (prices.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized %
};

// ============================================
// MAIN PREDICTION ALGORITHM
// ============================================
const predictPrice = (prices: number[]): PredictionResult | null => {
    if (prices.length < 50) return null; // Need sufficient data

    const currentPrice = prices[prices.length - 1];

    // 1. Calculate Indicators
    const sma5Arr = calculateSMA(prices, 5);
    const sma20Arr = calculateSMA(prices, 20);
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const volatility = calculateVolatility(prices);

    const sma5 = sma5Arr[sma5Arr.length - 1];
    const sma20 = sma20Arr[sma20Arr.length - 1];

    // 2. Trend Strength
    const trendStrength = sma20 !== 0 ? (sma5 - sma20) / sma20 : 0;

    // 3. Momentum (5-day price change)
    const price5DaysAgo = prices[prices.length - 5];
    const momentum = price5DaysAgo !== 0 ? (currentPrice - price5DaysAgo) / price5DaysAgo : 0;

    // 4. RSI Adjustment
    let rsiAdjustment = 0;
    if (rsi < 30) rsiAdjustment = 0.02; // Oversold -> Boost
    else if (rsi > 70) rsiAdjustment = -0.02; // Overbought -> Drag

    // 5. Prediction Formula (Weighted)
    const predictedChangeParam = (trendStrength * 0.4) + (momentum * 0.4) + rsiAdjustment;

    // 6. Generate Signal
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (rsi < 35 && trendStrength > 0) signal = 'BUY';
    else if (rsi > 65 && trendStrength < 0) signal = 'SELL';
    else if (macd > 0 && sma5 > sma20) signal = 'BUY';

    // 7. Confidence Score (Inverse of Volatility, clamped 50-95)
    // High volatility = Low confidence
    const confidence = Math.max(50, Math.min(95, 100 - volatility * 1.5));

    // 8. Generate 7-Day Forecast Points
    const predictions: Prediction[] = [];
    let tempPrice = currentPrice;

    // Daily Drift
    const dailyDrift = predictedChangeParam / 7;
    // Daily Volatility (for Support/Resistance bands)
    const dailyVol = volatility / 100 / Math.sqrt(252);

    for (let day = 1; day <= 7; day++) {
        // Compound growth
        tempPrice = tempPrice * (1 + dailyDrift);

        // Support/Resistance Levels
        const range = tempPrice * dailyVol;

        predictions.push({
            day,
            predicted: tempPrice,
            low: tempPrice - range * 1.5, // Support
            high: tempPrice + range * 1.5 // Resistance
        });
    }

    const finalPred = predictions[predictions.length - 1].predicted;
    const finalChange = ((finalPred - currentPrice) / currentPrice) * 100;

    return {
        symbol: 'UNKNOWN',
        currentPrice: currentPrice,
        predictions,
        predictedChange: finalChange,
        confidence,
        trend: finalChange > 0 ? 'bullish' : 'bearish',
        signal,
        indicators: {
            rsi,
            macd,
            volatility,
            trendStrength,
            sma5,
            sma20,
            momentum
        },
        lastUpdated: Date.now()
    };
};

// ============================================
// COMPONENT
// ============================================

const Investments = () => {
    // --- STATE ---
    const [holdings, setHoldings] = useState<Holding[]>(INITIAL_HOLDINGS);
    const [selectedStock, setSelectedStock] = useState('RELIANCE');
    const [chartPeriod] = useState('3M'); // Default to 3M for better analysis data
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [predictionData, setPredictionData] = useState<ChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showPrediction, setShowPrediction] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [stockDropdownOpen, setStockDropdownOpen] = useState(false);

    // Real-Time Price
    const [rtPrice, setRtPrice] = useState<AggregatedPrice | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Refs
    // const mountedRef = useRef(true); // Unused
    const lastFetchTimeRef = useRef<number>(0);
    const predictionCacheRef = useRef<Record<string, PredictionResult>>({});

    // --------------------------------------------
    // 1. REAL-TIME PRICE FETCHING
    // --------------------------------------------
    // --------------------------------------------
    // 2. REAL-TIME PRICE FETCHING (PROGRESSIVE)
    // --------------------------------------------
    const [loadingStocks, setLoadingStocks] = useState<Set<string>>(new Set());

    const fetchPriceForStock = async (symbol: string) => {
        // Prevent duplicate fetches
        if (loadingStocks.has(symbol)) return;

        setLoadingStocks(prev => new Set(prev).add(symbol));
        const normalized = normalizeSymbol(symbol);

        try {
            // Try own backend first (proxy to optimized yfinance)
            try {
                const res = await fetch(`http://localhost:5000/api/stocks/${symbol}/price`, {
                    signal: AbortSignal.timeout(5000)
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.price) {
                        setHoldings(prev => prev.map(h => {
                            if (h.symbol === symbol) {
                                const change = data.changePercent !== undefined ? data.changePercent : 0;
                                return {
                                    ...h,
                                    price: data.price,
                                    value: data.price * h.holdings,
                                    change: parseFloat(change.toFixed(2))
                                };
                            }
                            return h;
                        }));
                        setLoadingStocks(prev => {
                            const next = new Set(prev);
                            next.delete(symbol);
                            return next;
                        });
                        return; // Success
                    }
                }
            } catch (e) {
                // Backend failed, fall back to external APIs if keys exist
            }

            // Fallback: Finnhub/FMP (Client side)
            let price = 0;
            if (KEYS.FINNHUB) {
                const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${normalized}&token=${KEYS.FINNHUB}`);
                const d = await r.json();
                if (d.c) price = d.c;
            }

            if (price > 0) {
                setHoldings(prev => prev.map(h => {
                    if (h.symbol === symbol) {
                        return {
                            ...h,
                            price: price,
                            value: price * h.holdings
                        };
                    }
                    return h;
                }));
            }

        } catch (e) {
            console.warn(`Failed to fetch ${symbol}`, e);
        } finally {
            setLoadingStocks(prev => {
                const next = new Set(prev);
                next.delete(symbol);
                return next;
            });
        }
    };

    const fetchRealTimePrice = useCallback(async (force = false) => {
        // Refresh all holdings in parallel
        holdings.forEach(stock => {
            fetchPriceForStock(stock.symbol);
        });

        // Also fetch selected stock for big display
        if (selectedStock) {
            // Re-use logic or just rely on the holding update if it's in holdings
            // For the big display "rtPrice", we keep the old logic or link it to holdings
            // For now, let's keep the old logic for "Real Time Price" display to avoid breaking it, 
            // but wrapped in a check
            const now = Date.now();
            if (!force && now - lastFetchTimeRef.current < 15000 && rtPrice) return;

            setIsRefreshing(true);
            try {
                // ... (Existing logic for single selected stock display if needed, 
                // but relying on backend is better now)
                const res = await fetch(`http://localhost:5000/api/stocks/${selectedStock}/price`);
                if (res.ok) {
                    const d = await res.json();
                    setRtPrice({
                        ltp: d.price,
                        confidence: 'HIGH',
                        timestamp: now,
                        sources: 1,
                        isCached: d.is_cached
                    });
                }
            } catch { }
            setIsRefreshing(false);
        }
    }, [selectedStock, holdings, rtPrice]);

    // --------------------------------------------
    // 2. CHART & ANALYSIS ENGINE
    // --------------------------------------------
    const fetchChartData = useCallback(async () => {
        setIsLoading(true);
        // Use raw symbol for API call (backend handles .NS suffix internally)
        let rawData: ChartPoint[] = [];

        try {
            // Primary: Backend yfinance (Most reliable)
            try {
                const res = await fetch(`http://localhost:5000/api/stocks/${selectedStock}/chart?period=${chartPeriod}`, {
                    signal: AbortSignal.timeout(8000)
                });
                if (res.ok) {
                    const d = await res.json();
                    if (d.data && Array.isArray(d.data)) {
                        rawData = d.data;
                    }
                }
            } catch (e) {
                console.warn("Backend Chart Fail", e);
            }

            // Fallback: FMP (Client side)
            if (rawData.length === 0 && KEYS.FMP) {
                try {
                    const res = await fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${normalizeSymbol(selectedStock)}?apikey=${KEYS.FMP}`);
                    const d = await res.json();
                    if (d.historical) {
                        rawData = d.historical.map((x: any) => ({ date: x.date, price: x.close })).reverse();
                    }
                } catch (e) { console.warn("FMP Chart Fail", e); }
            }

            if (rawData.length > 0) {
                // --- EXECUTE PREDICTION ENGINE ---
                const prices = rawData.map(d => d.price);

                // Call Backend ML Predictor
                try {
                    const mlRes = await fetch('http://localhost:5000/api/stocks/predict', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ symbol: selectedStock, days: 7 })
                    });

                    if (mlRes.ok) {
                        const predResult: PredictionResult = await mlRes.json();
                        // Add signal logic (simple frontend logic based on backend data)
                        if (!predResult.signal) {
                            if (predResult.trend === 'bullish' && predResult.confidence > 60) predResult.signal = 'BUY';
                            else if (predResult.trend === 'bearish' && predResult.confidence > 60) predResult.signal = 'SELL';
                            else predResult.signal = 'HOLD';
                        }

                        setPrediction(predResult);
                        predictionCacheRef.current[selectedStock] = predResult;
                        if (showPrediction) updatePredictionGraph(predResult, prices[prices.length - 1]);
                    } else {
                        // Fallback to local if backend fails
                        const predResult = predictPrice(prices); // Keep local as fallback
                        if (predResult) {
                            setPrediction(predResult);
                            predictionCacheRef.current[selectedStock] = predResult;
                            if (showPrediction) updatePredictionGraph(predResult, prices[prices.length - 1]);
                        }
                    }
                } catch (e) {
                    console.warn("ML Predict fail", e);
                    const predResult = predictPrice(prices);
                    if (predResult) setPrediction(predResult);
                }

                // --- FILTER FOR CHART DISPLAY ---
                // We analyze huge history but only show what user asked (1M, 3M, etc)
                let daysToSub = 30;
                switch (chartPeriod) {
                    case '1D': daysToSub = 2; break; // Approximations for daily chart using eod data
                    case '1W': daysToSub = 7; break;
                    case '1M': daysToSub = 30; break;
                    case '3M': daysToSub = 90; break;
                    case '1Y': daysToSub = 365; break;
                }

                setChartData(rawData.slice(-daysToSub));
            }
        } finally {
            setIsLoading(false);
        }
    }, [selectedStock, chartPeriod, showPrediction]);

    // Helper to format prediction points - starts from chart's last price
    const updatePredictionGraph = (pred: PredictionResult, basePrice?: number) => {
        // Use basePrice from chart data, or fall back to pred.currentPrice
        const startPrice = basePrice || pred.currentPrice || pred.predictions[0]?.predicted || 0;

        // Recalculate prediction points based on daily change from predictedChange
        const dailyChange = (pred.predictedChange / 7) / 100;
        const points = [];
        let val = startPrice;

        for (let i = 0; i < 7; i++) {
            val = val * (1 + dailyChange);
            const d = new Date();
            d.setDate(d.getDate() + i + 1);
            points.push({ date: d.toLocaleDateString(), price: Math.round(val * 100) / 100 });
        }

        setPredictionData(points);
    };

    // --------------------------------------------
    // EFFECTS
    // --------------------------------------------
    useEffect(() => {
        fetchRealTimePrice(true);
        // Polling every 10s as requested
        const i = setInterval(() => fetchRealTimePrice(), 10000);
        return () => clearInterval(i);
    }, [fetchRealTimePrice]);

    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);

    const handlePredictClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (showPrediction) {
            setShowPrediction(false);
            return;
        }

        // Always fetch fresh predictions to avoid stale cache
        setShowPrediction(true);
        setIsLoading(true);

        try {
            const mlRes = await fetch('http://localhost:5000/api/stocks/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: selectedStock, days: 7 })
            });

            if (mlRes.ok) {
                const predResult: PredictionResult = await mlRes.json();
                // Add signal logic
                if (!predResult.signal) {
                    if (predResult.trend === 'bullish' && predResult.confidence > 60) predResult.signal = 'BUY';
                    else if (predResult.trend === 'bearish' && predResult.confidence > 60) predResult.signal = 'SELL';
                    else predResult.signal = 'HOLD';
                }
                setPrediction(predResult);
                predictionCacheRef.current[selectedStock] = predResult;
                // Use chart's last price for visual consistency
                const basePrice = chartData.length > 0 ? chartData[chartData.length - 1].price : undefined;
                updatePredictionGraph(predResult, basePrice);
            }
        } catch (err) {
            console.warn("Prediction fetch failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    // --------------------------------------------
    // UI CONFIG
    // --------------------------------------------
    const chartConfig = {
        labels: [
            ...chartData.map(d => d.date),
            ...(showPrediction ? predictionData.map(d => d.date) : [])
        ],
        datasets: [
            {
                label: 'Price',
                data: [
                    ...chartData.map(d => d.price),
                    ...(showPrediction ? Array(predictionData.length).fill(null) : [])
                ],
                borderColor: '#00b8d4',
                backgroundColor: 'rgba(0,184,212,0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 0,
                borderWidth: 2
            },
            ...(showPrediction ? [{
                label: 'AI Forecast',
                data: [
                    ...Array(chartData.length).fill(null),
                    chartData[chartData.length - 1]?.price, // Bridge gap
                    ...predictionData.map(d => d.price)
                ],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.1)',
                borderDash: [5, 5],
                tension: 0.3,
                pointRadius: 4,
                borderWidth: 2
            }] : [])
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1a1a2e',
                titleColor: '#fff',
                bodyColor: '#ccc'
            }
        },
        scales: {
            x: { display: false },
            y: {
                grid: { color: '#222' },
                ticks: { color: '#666' }
            }
        },
        interaction: { intersect: false, mode: 'index' as const }
    } as const;

    // Filter stocks
    const filteredStocks = INDIAN_STOCKS.filter(s =>
        s.symbol.includes(searchQuery.toUpperCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="investments-page">
            {/* Header Stats */}
            <div className="investments-header">
                <div className="stat-card stat-total">
                    <div className="stat-label">TOTAL VALUE</div>
                    <div className="stat-value">₹84.5K</div>
                </div>
                <div className="stat-card stat-pnl">
                    <div className="stat-label">TOTAL P&L</div>
                    <div className="stat-value positive">+₹12.4K</div>
                    <div className="stat-meta positive">↑ 14.2%</div>
                </div>
                <div className="stat-card stat-holdings">
                    <div className="stat-label">HOLDINGS</div>
                    <div className="stat-value">{holdings.length}</div>
                </div>
            </div>

            <div className="investments-content">
                {/* Left Panel: Chart & Analysis */}
                <div className="chart-section">
                    <div className="chart-header">
                        <div className="chart-title flex items-center gap-2">
                            <Sparkles size={18} className="text-blue-400" />
                            <span>Analysis Engine</span>
                            {isRefreshing && <RefreshCw size={14} className="spin text-gray-400" />}
                        </div>

                        <div className="chart-controls">
                            <button type="button" className={`ai-predict-btn ${showPrediction ? 'active' : ''}`} onClick={handlePredictClick}>
                                <Activity size={14} />
                                {showPrediction ? 'Hide Analysis' : 'AI Forecast'}
                            </button>

                            {/* Stock Selector */}
                            <div className="stock-selector">
                                <button className="stock-dropdown-btn" onClick={() => setStockDropdownOpen(!stockDropdownOpen)}>
                                    {selectedStock} <ChevronDown size={14} />
                                </button>
                                {stockDropdownOpen && (
                                    <div className="stock-dropdown">
                                        <input className="stock-search" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                        {filteredStocks.map(s => (
                                            <button key={s.symbol} className="stock-option" onClick={() => {
                                                setSelectedStock(s.symbol); setStockDropdownOpen(false); setShowPrediction(false);
                                            }}>
                                                <span>{s.symbol}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chart with AI Panel Sidebar */}
                    <div className="chart-with-ai-wrapper">
                        {/* Main Chart */}
                        <div className="chart-container">
                            {isLoading && !showPrediction ? (
                                <div className="h-full w-full flex items-center justify-center text-gray-500 flex-col gap-2">
                                    <RefreshCw className="spin" />
                                    <span className="text-xs">Analyzing Market Data...</span>
                                </div>
                            ) : (
                                <Line data={chartConfig} options={chartOptions} />
                            )}
                        </div>

                        {/* AI Analysis Panel - Right Sidebar */}
                        <AnimatePresence>
                            {showPrediction && prediction && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="ai-analysis-panel"
                                >
                                    {/* Header */}
                                    <div className="ai-panel-header">
                                        <div className="flex items-center gap-3">
                                            <div className="ai-icon-wrapper">
                                                <Sparkles size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white tracking-wide">AI Analysis</h3>
                                                <span className="text-[10px] text-cyan-400/80 font-medium">{prediction.source || 'Gemini 1.5 Flash'}</span>
                                            </div>
                                        </div>
                                        <motion.div
                                            className={`ai-signal-badge ${prediction.signal === 'BUY' ? 'buy' : prediction.signal === 'SELL' ? 'sell' : 'hold'}`}
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        >
                                            {prediction.signal === 'BUY' && <TrendingUp size={12} />}
                                            {prediction.signal === 'SELL' && <TrendingDown size={12} />}
                                            {prediction.signal}
                                        </motion.div>
                                    </div>

                                    {/* Indicator Cards Grid */}
                                    <div className="ai-indicators-grid">
                                        <div className={`ai-indicator-card ${prediction.indicators.rsi > 70 ? 'danger' : prediction.indicators.rsi < 30 ? 'success' : ''}`}>
                                            <span className="label">RSI (14)</span>
                                            <span className="value">{prediction.indicators.rsi?.toFixed(1) || '--'}</span>
                                            <span className="status">{prediction.indicators.rsi > 70 ? 'Overbought' : prediction.indicators.rsi < 30 ? 'Oversold' : 'Neutral'}</span>
                                        </div>
                                        <div className={`ai-indicator-card ${(prediction.indicators.macd ?? 0) > 0 ? 'success' : 'danger'}`}>
                                            <span className="label">MACD</span>
                                            <span className="value">{prediction.indicators.macd?.toFixed(2) || '0.00'}</span>
                                            <span className="status">{(prediction.indicators.macd ?? 0) > 0 ? 'Bullish' : 'Bearish'}</span>
                                        </div>
                                        <div className="ai-indicator-card">
                                            <span className="label">Volatility</span>
                                            <span className="value">{prediction.indicators.volatility?.toFixed(1) || '0.0'}%</span>
                                            <span className="status">{(prediction.indicators.volatility ?? 0) > 30 ? 'High' : 'Normal'}</span>
                                        </div>
                                        <div className={`ai-indicator-card ${prediction.trend === 'bullish' ? 'success' : 'danger'}`}>
                                            <span className="label">Trend</span>
                                            <span className="value">{prediction.trend === 'bullish' ? '📈' : '📉'}</span>
                                            <span className="status capitalize">{prediction.trend}</span>
                                        </div>
                                    </div>

                                    {/* 7-Day Forecast Section */}
                                    <div className="ai-forecast-section">
                                        <div className="forecast-header">
                                            <span>7-Day Price Forecast</span>
                                            <div className="confidence-badge">
                                                <ShieldCheck size={10} />
                                                {prediction.confidence}% confidence
                                            </div>
                                        </div>
                                        <div className="forecast-price">
                                            <span className={`price ${prediction.predictedChange >= 0 ? 'up' : 'down'}`}>
                                                ₹{Number(prediction.predictions[prediction.predictions.length - 1]?.predicted || prediction.currentPrice || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </span>
                                            <span className={`change ${prediction.predictedChange >= 0 ? 'up' : 'down'}`}>
                                                {prediction.predictedChange >= 0 ? '+' : ''}{Number(prediction.predictedChange || 0).toFixed(2)}%
                                                {prediction.predictedChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            </span>
                                        </div>
                                        {/* Confidence Bar */}
                                        <div className="confidence-bar-wrapper">
                                            <motion.div
                                                className="confidence-bar"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${prediction.confidence}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Stock Info Below Chart */}
                    <div className="stock-info-compact">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedStock}</h2>
                            <span className="text-gray-400 text-sm">{INDIAN_STOCKS.find(s => s.symbol === selectedStock)?.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {rtPrice && (
                                <>
                                    <span className="text-3xl font-mono text-white">₹{rtPrice.ltp.toLocaleString()}</span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${rtPrice.confidence === 'HIGH' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                        {rtPrice.confidence}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Holdings */}
                    <div className="right-panel">
                        <div className="portfolio-panel">
                            <div className="portfolio-header">
                                <div>
                                    <h3>Your Portfolio</h3>
                                    <p>{holdings.length} Assets</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="add-btn"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="holdings-list">
                                {holdings.map(h => (
                                    <div key={h.id} className="holding-card">
                                        <div className="holding-left">
                                            <div
                                                className="holding-icon"
                                                style={{
                                                    background: `linear-gradient(135deg, ${h.color}40, ${h.color}20)`,
                                                    color: h.color,
                                                    border: `1px solid ${h.color}50`
                                                }}
                                            >
                                                {h.symbol.slice(0, 2)}
                                            </div>
                                            <div className="holding-info">
                                                <span className="holding-symbol">{h.symbol}</span>
                                                <span className="holding-units">{h.holdings} UNITS</span>
                                            </div>
                                        </div>
                                        <div className="holding-right">
                                            <span className="holding-value">₹{h.value.toLocaleString()}</span>
                                            <span className={`holding-change ${h.change > 0 ? 'up' : h.change < 0 ? 'down' : ''}`}>
                                                {h.change > 0 && <TrendingUp size={10} />}
                                                {h.change < 0 && <TrendingDown size={10} />}
                                                {h.change > 0 ? '+' : ''}{h.change.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                <div className="add-asset-card">
                                    + Add another asset
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showAddModal && (
                        <motion.div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                            {/* Placeholder Modal */}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Investments;
