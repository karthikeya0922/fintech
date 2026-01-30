import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    type: string;
}

// Mock data for when backend is not running
const MOCK_TICKER: TickerItem[] = [
    { symbol: 'SENSEX', price: 75234.12, change: 387.45, changePercent: 0.52, type: 'index' },
    { symbol: 'Bank Nifty', price: 48567.25, change: -125.30, changePercent: -0.26, type: 'index' },
    { symbol: 'Nifty 50', price: 22834.80, change: 156.20, changePercent: 0.69, type: 'index' },
    { symbol: 'Bitcoin', price: 98456.78, change: 2344.56, changePercent: 2.44, type: 'crypto' },
    { symbol: 'Ethereum', price: 3456.12, change: 89.23, changePercent: 2.65, type: 'crypto' },
    { symbol: 'Gold', price: 75234.00, change: -123.45, changePercent: -0.16, type: 'commodity' },
];

const StockTicker = () => {
    const [prices, setPrices] = useState<TickerItem[]>(MOCK_TICKER);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/ticker/prices');
                if (response.ok) {
                    const data = await response.json();
                    if (data.prices?.length > 0) {
                        setPrices(data.prices);
                    }
                }
            } catch {
                // Use mock data if backend is not available
                console.log('Using mock ticker data');
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 60000); // Refresh every minute

        return () => clearInterval(interval);
    }, []);

    // Double the items for seamless scrolling
    const duplicatedPrices = [...prices, ...prices];

    const formatPrice = (price: number, type: string) => {
        if (type === 'crypto') {
            return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="stock-ticker">
            <motion.div
                className="ticker-track"
                animate={{
                    x: [0, -50 * prices.length * 4],
                }}
                transition={{
                    x: {
                        duration: 30,
                        repeat: Infinity,
                        ease: 'linear',
                    },
                }}
            >
                {duplicatedPrices.map((item, index) => (
                    <div key={`${item.symbol}-${index}`} className="ticker-item">
                        <span className="ticker-symbol">{item.symbol}</span>
                        <span className="ticker-price">{formatPrice(item.price, item.type)}</span>
                        <span className={`ticker-change ${item.change >= 0 ? 'positive' : 'negative'}`}>
                            {item.change >= 0 ? (
                                <TrendingUp size={12} />
                            ) : (
                                <TrendingDown size={12} />
                            )}
                            {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default StockTicker;
