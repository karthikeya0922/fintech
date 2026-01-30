import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCw,
    Clock,
    TrendingUp,
    ExternalLink,
    Radio
} from 'lucide-react';

interface NewsArticle {
    title: string;
    description: string;
    source: string;
    category: string;
    image: string;
    url: string;
    publishedAt: string;
    readTime: number;
    isBreaking?: boolean;
}

const CATEGORIES = ['For You', 'Markets', 'Crypto', 'Economy', 'Tech', 'Startups', 'World'];

const NewsHub = () => {
    const [activeCategory, setActiveCategory] = useState('For You');
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [breaking, setBreaking] = useState<NewsArticle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        fetchNews();
        fetchBreaking();
    }, [activeCategory]);

    const fetchNews = async () => {
        setIsLoading(true);
        try {
            const category = activeCategory === 'For You' ? '' : activeCategory;
            const response = await fetch(`http://localhost:5000/api/news?category=${category}&limit=12`);
            if (response.ok) {
                const data = await response.json();
                setNews(data.news || []);
            }
        } catch {
            // Mock data fallback
            setNews([
                {
                    title: 'Markets Rally as RBI Maintains Interest Rates',
                    description: 'Indian stock markets surged today following the RBI decision to keep benchmark interest rates unchanged.',
                    source: 'Economic Times',
                    category: 'Markets',
                    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
                    url: '#',
                    publishedAt: new Date().toISOString(),
                    readTime: 5
                },
                {
                    title: 'Bitcoin Crosses $98,000 Amid Institutional Buying',
                    description: 'Cryptocurrency markets see renewed interest as major institutions increase holdings.',
                    source: 'CoinDesk',
                    category: 'Crypto',
                    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800',
                    url: '#',
                    publishedAt: new Date().toISOString(),
                    readTime: 4
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBreaking = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/news/breaking');
            if (response.ok) {
                const data = await response.json();
                setBreaking(data.breaking?.[0] || null);
            }
        } catch {
            setBreaking({
                title: 'IPO Listing of PSEs as a Sound Divestment Strategy',
                description: 'Divestment transforms state ownership into a continuously scrutinized economic asset.',
                source: 'The Times of India',
                category: 'Markets',
                image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800',
                url: '#',
                publishedAt: new Date().toISOString(),
                readTime: 9,
                isBreaking: true
            });
        }
    };

    const handleRefresh = () => {
        setLastRefresh(new Date());
        fetchNews();
        fetchBreaking();
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return date.toLocaleDateString();
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
            className="newshub-page"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div className="page-header" variants={itemVariants}>
                <h1 className="page-title">News Hub</h1>
                <div className="newshub-actions">
                    <span className="last-refresh">
                        <Clock size={14} />
                        {formatTime(lastRefresh.toISOString())}
                    </span>
                    <button className="refresh-btn" onClick={handleRefresh}>
                        <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
                        Refresh
                    </button>
                </div>
            </motion.div>

            {/* Category Tabs */}
            <motion.div className="category-tabs" variants={itemVariants}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </motion.div>

            {/* Breaking News */}
            {breaking && (
                <motion.div className="breaking-news" variants={itemVariants}>
                    <div className="breaking-badge">
                        <Radio size={14} className="pulse" />
                        BREAKING
                    </div>
                    <div className="breaking-content">
                        <div className="breaking-text">
                            <h2>{breaking.title}</h2>
                            <p>{breaking.description}</p>
                            <div className="breaking-meta">
                                <span className="source">{breaking.source}</span>
                                <span className="dot">•</span>
                                <span>{breaking.readTime} min read</span>
                            </div>
                        </div>
                        {breaking.image && (
                            <div className="breaking-image">
                                <img src={breaking.image} alt="" />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* News Grid */}
            <motion.div className="news-grid" variants={containerVariants}>
                {news.map((article, i) => (
                    <motion.article
                        key={i}
                        className="news-card"
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                    >
                        {article.image && (
                            <div className="news-image">
                                <img src={article.image} alt="" loading="lazy" />
                                <span className="news-category">{article.category}</span>
                            </div>
                        )}
                        <div className="news-content">
                            <h3>{article.title}</h3>
                            <p>{article.description}</p>
                            <div className="news-meta">
                                <span className="source">{article.source}</span>
                                <span className="dot">•</span>
                                <span>{formatTime(article.publishedAt)}</span>
                                <span className="dot">•</span>
                                <span>{article.readTime} min</span>
                            </div>
                        </div>
                        <a href={article.url} className="news-link" target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={16} />
                        </a>
                    </motion.article>
                ))}
            </motion.div>

            {/* Trending Sidebar */}
            <motion.div className="trending-section" variants={itemVariants}>
                <h3 className="trending-title">
                    <TrendingUp size={18} />
                    Trending Topics
                </h3>
                <ul className="trending-list">
                    <li><span className="rank">1</span> RBI Policy</li>
                    <li><span className="rank">2</span> Nifty 50</li>
                    <li><span className="rank">3</span> Bitcoin ETF</li>
                    <li><span className="rank">4</span> Tech Stocks</li>
                    <li><span className="rank">5</span> Budget 2026</li>
                </ul>
            </motion.div>
        </motion.div>
    );
};

export default NewsHub;
