import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Plus,
    X,
    Sparkles,
    RefreshCw,
    ChevronDown,
    ShieldCheck,
    Clock,
    Zap,
    Activity,
    BarChart2,
    Target
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
    trend: 'bullish' | 'bearish';
    signal: 'BUY' | 'SELL' | 'HOLD';
    indicators: {
        rsi: number;
        macd: number;
        volatility: number;
        trendStrength: number;
        sma5: number;
        sma20: number;
        momentum: number;
    };
    lastUpdated: number;
}

interface StockPricePrice {
    price: number;
    source: string;
    timestamp: number;
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
    { symbol: 'HDFC', name: 'HDFC Bank' },
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
    { id: '4', symbol: 'HDFC', name: 'HDFC Bank', type: 'STOCK', price: 1620.40, holdings: 8, value: 12963.2, change: 0.45, color: '#ef4444' },
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
    const [chartPeriod, setChartPeriod] = useState('3M'); // Default to 3M for better analysis data
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
    const mountedRef = useRef(true);
    const lastPriceRef = useRef<number | null>(null);
    const lastFetchTimeRef = useRef<number>(0);
    const predictionCacheRef = useRef<Record<string, PredictionResult>>({});

    // --------------------------------------------
    // 1. REAL-TIME PRICE FETCHING
    // --------------------------------------------
    const fetchRealTimePrice = useCallback(async (force = false) => {
        const now = Date.now();
        // 15s Cache
        if (!force && now - lastFetchTimeRef.current < 15000 && rtPrice) return;

        setIsRefreshing(true);
        const symbol = normalizeSymbol(selectedStock);

        // Fast Tier: Finnhub + FMP
        const fetchers = [
            (async () => {
                if (!KEYS.FINNHUB) return null;
                try {
                    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${KEYS.FINNHUB}`);
                    const d = await r.json();
                    if (d.c > 0) return { price: d.c, source: 'Finnhub', timestamp: now };
                } catch { } return null;
            })(),
            (async () => {
                if (!KEYS.FMP) return null;
                try {
                    const r = await fetch(`https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=${KEYS.FMP}`);
                    const d = await r.json();
                    if (Array.isArray(d) && d[0]?.price) return { price: d[0].price, source: 'FMP', timestamp: now };
                } catch { } return null;
            })()
        ];

        let results = await Promise.all(fetchers);
        let valid = results.filter((r): r is StockPricePrice => r !== null);

        // Fallback Tier: Alpha Vantage
        if (valid.length === 0 && KEYS.ALPHAVANTAGE) {
            try {
                const r = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${KEYS.ALPHAVANTAGE}`);
                const d = await r.json();
                const q = d['Global Quote'];
                if (q && q['05. price']) valid.push({ price: parseFloat(q['05. price']), source: 'AV', timestamp: now });
            } catch { }
        }

        if (!mountedRef.current) return;

        if (valid.length > 0) {
            valid.sort((a, b) => a.price - b.price);
            const median = valid.length % 2 !== 0
                ? valid[Math.floor(valid.length / 2)].price
                : (valid[valid.length / 2 - 1].price + valid[valid.length / 2].price) / 2;

            lastPriceRef.current = median;
            lastFetchTimeRef.current = now;
            setRtPrice({
                ltp: median,
                confidence: valid.length >= 2 ? 'HIGH' : 'LOW',
                timestamp: now,
                sources: valid.length,
                isCached: false
            });
        } else if (lastPriceRef.current) {
            // Keep showing old price if fetch fails
            setRtPrice(prev => prev ? { ...prev, isCached: true } : null);
        }
        setIsRefreshing(false);
    }, [selectedStock, rtPrice]);

    // --------------------------------------------
    // 2. CHART & ANALYSIS ENGINE
    // --------------------------------------------
    const fetchChartData = useCallback(async () => {
        setIsLoading(true);
        const symbol = normalizeSymbol(selectedStock);
        let rawData: ChartPoint[] = [];

        // Primary: FMP Historical (Fast, Full History)
        if (KEYS.FMP) {
            try {
                const res = await fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${KEYS.FMP}`);
                const d = await res.json();
                if (d.historical) {
                    rawData = d.historical.map((x: any) => ({ date: x.date, price: x.close })).reverse();
                }
            } catch (e) { console.warn("FMP Chart Fail", e); }
        }

        // Secondary: Alpha Vantage (If FMP fails)
        if (rawData.length === 0 && KEYS.ALPHAVANTAGE) {
            try {
                const res = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${KEYS.ALPHAVANTAGE}&outputsize=compact`);
                const d = await res.json();
                const ts = d['Time Series (Daily)'];
                if (ts) {
                    // Convert AV object to array
                    rawData = Object.keys(ts).sort().map(date => ({
                        date,
                        price: parseFloat(ts[date]['4. close'])
                    }));
                }
            } catch (e) { console.warn("AV Chart Fail", e); }
        }

        if (rawData.length > 0) {
            // --- EXECUTE PREDICTION ENGINE ---
            const prices = rawData.map(d => d.price);

            // Analyze using full history available
            const predResult = predictPrice(prices);

            if (predResult) {
                predResult.symbol = selectedStock;
                setPrediction(predResult);
                predictionCacheRef.current[selectedStock] = predResult;

                // If chart is already showing prediction, update it live
                if (showPrediction) updatePredictionGraph(predResult);
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
        setIsLoading(false);
    }, [selectedStock, chartPeriod, showPrediction]);

    // Helper to format prediction points
    const updatePredictionGraph = (pred: PredictionResult) => {
        const points = pred.predictions.map(p => {
            const d = new Date();
            d.setDate(d.getDate() + p.day);
            return { date: d.toLocaleDateString(), price: p.predicted };
        });
        setPredictionData(points);
    };

    // --------------------------------------------
    // EFFECTS
    // --------------------------------------------
    useEffect(() => {
        fetchRealTimePrice(true);
        // Polling every 10s
        const i = setInterval(() => fetchRealTimePrice(), 10000);
        return () => clearInterval(i);
    }, [fetchRealTimePrice]);

    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);

    const handlePredictClick = () => {
        if (showPrediction) {
            setShowPrediction(false);
            return;
        }
        // Force update graph if we have prediction
        if (prediction) {
            updatePredictionGraph(prediction);
            setShowPrediction(true);
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
                            <button className={`ai-predict-btn ${showPrediction ? 'active' : ''}`} onClick={handlePredictClick}>
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

                    <div className="stock-info mb-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-1">{selectedStock}</h2>
                                <h3 className="text-gray-400 text-sm mb-2">{INDIAN_STOCKS.find(s => s.symbol === selectedStock)?.name}</h3>
                                <div className="flex items-center gap-3">
                                    {rtPrice ? (
                                        <>
                                            <span className="text-4xl font-mono mobile-price text-white">₹{rtPrice.ltp.toLocaleString()}</span>
                                            <span className={`px-2 py-1 rounded text-xs border font-bold flex items-center gap-1 ${rtPrice.confidence === 'HIGH' ? 'border-green-800 text-green-400 bg-green-900/20' : 'border-yellow-800 text-yellow-400 bg-yellow-900/20'}`}>
                                                <ShieldCheck size={12} />
                                                {rtPrice.confidence}
                                            </span>
                                            <span className="text-xs text-gray-500">{rtPrice.sources} Src</span>
                                        </>
                                    ) : (
                                        <span className="text-gray-500 italic">Syncing live prices...</span>
                                    )}
                                </div>
                            </div>

                            {/* ADVANCED PREDICTION PANEL */}
                            {showPrediction && prediction && (
                                <div className="w-full md:w-auto flex flex-col gap-2 p-3 bg-gray-900/80 rounded-lg border border-gray-800 text-sm min-w-[240px] backdrop-blur-md shadow-xl">
                                    {/* Header Signal */}
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                        <span className="text-gray-400 text-xs uppercase tracking-wider">AI Signal</span>
                                        <div className={`flex items-center gap-1 font-bold px-3 py-0.5 rounded ${prediction.signal === 'BUY' ? 'bg-green-500 text-black' :
                                                prediction.signal === 'SELL' ? 'bg-red-500 text-black' : 'bg-gray-600 text-white'
                                            }`}>
                                            {prediction.signal === 'BUY' ? <TrendingUp size={14} /> : prediction.signal === 'SELL' ? <TrendingDown size={14} /> : <Activity size={14} />}
                                            {prediction.signal}
                                        </div>
                                    </div>

                                    {/* Indicators Grid */}
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs py-1">
                                        <span className="text-gray-500">RSI (14)</span>
                                        <span className={`text-right font-mono ${prediction.indicators.rsi > 70 ? 'text-red-400' : prediction.indicators.rsi < 30 ? 'text-green-400' : 'text-gray-300'}`}>
                                            {prediction.indicators.rsi.toFixed(1)}
                                        </span>

                                        <span className="text-gray-500">MACD</span>
                                        <span className={`text-right font-mono ${prediction.indicators.macd > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {prediction.indicators.macd.toFixed(2)}
                                        </span>

                                        <span className="text-gray-500">Volatilty</span>
                                        <span className="text-right font-mono text-blue-300">{prediction.indicators.volatility.toFixed(1)}%</span>

                                        <span className="text-gray-500">Trend</span>
                                        <span className={`text-right font-mono ${prediction.indicators.trendStrength > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {(prediction.indicators.trendStrength * 100).toFixed(2)}%
                                        </span>
                                    </div>

                                    {/* Footer Target */}
                                    <div className="pt-2 mt-1 border-t border-gray-700">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">7D Target</span>
                                            <div className="text-right">
                                                <span className={`block font-bold text-sm ${prediction.predictedChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    ₹{prediction.predictions[6].predicted.toFixed(0)}
                                                </span>
                                                <span className="text-[10px] text-gray-500 block">
                                                    {prediction.predictedChange > 0 ? '+' : ''}{prediction.predictedChange.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="chart-container h-[400px]">
                        {isLoading && !showPrediction ? (
                            <div className="h-full w-full flex items-center justify-center text-gray-500 flex-col gap-2">
                                <RefreshCw className="spin" />
                                <span className="text-xs">Analyzing Market Data...</span>
                            </div>
                        ) : (
                            <Line data={chartConfig} options={chartOptions} />
                        )}
                    </div>
                </div>

                {/* Right Panel: Holdings */}
                <div className="right-panel">
                    <div className="holdings-section">
                        <div className="holdings-header">
                            <h3>Holdings</h3>
                            <button className="add-asset-btn" onClick={() => setShowAddModal(true)}><Plus size={16} /> Add</button>
                        </div>
                        <div className="holdings-table">
                            <div className="table-header flex justify-between text-xs text-gray-500 mb-2 px-2">
                                <span>ASSET</span>
                                <span>VALUE</span>
                            </div>
                            {holdings.map(h => (
                                <div key={h.id} className="table-row flex justify-between items-center p-3 bg-gray-900/30 rounded mb-2 hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: h.color }}>
                                            {h.symbol.slice(0, 2)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{h.symbol}</div>
                                            <div className="text-xs text-gray-500">{h.holdings} Units</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-white text-sm">₹{h.value.toLocaleString()}</div>
                                        <div className={`text-xs ${h.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {h.change >= 0 ? '+' : ''}{h.change}%
                                        </div>
                                    </div>
                                </div>
                            ))}
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
    );
};

export default Investments;
