"""
Visnova 2.0 Backend - News Service
Fetches financial news from NewsData.io
"""
import requests
from datetime import datetime, timedelta
import random
from config import Config

# Cache for news data (to avoid slow API calls)
_news_cache = {
    'data': None,
    'timestamp': None,
    'ttl_minutes': 5  # Cache for 5 minutes
}

# Fallback mock news data
MOCK_NEWS = [
    {
        'title': 'Markets Rally as RBI Maintains Interest Rates',
        'description': 'Indian stock markets surged today following the RBI decision to keep benchmark interest rates unchanged, boosting investor confidence.',
        'source': 'Economic Times',
        'category': 'Markets',
        'image': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
        'url': '#',
        'publishedAt': datetime.now().isoformat(),
        'readTime': 5
    },
    {
        'title': 'Tech Stocks Lead Nifty IT to New Highs',
        'description': 'IT sector stocks continue their bullish run with TCS, Infosys, and Wipro showing strong quarterly results.',
        'source': 'Mint',
        'category': 'Tech',
        'image': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
        'url': '#',
        'publishedAt': (datetime.now() - timedelta(hours=2)).isoformat(),
        'readTime': 4
    },
    {
        'title': 'Bitcoin Crosses $98,000 Mark Amid Institutional Buying',
        'description': 'Cryptocurrency markets see renewed interest as major institutions increase their Bitcoin holdings.',
        'source': 'CoinDesk',
        'category': 'Crypto',
        'image': 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800',
        'url': '#',
        'publishedAt': (datetime.now() - timedelta(hours=4)).isoformat(),
        'readTime': 3
    },
    {
        'title': 'IPO Listing of PSEs as a Sound Divestment Strategy',
        'description': 'Divestment, when designed as a governance instrument rather than just a sale, transforms state ownership into a continuously scrutinized economic asset.',
        'source': 'The Times of India',
        'category': 'Markets',
        'image': 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800',
        'url': '#',
        'publishedAt': (datetime.now() - timedelta(days=1)).isoformat(),
        'readTime': 9,
        'isBreaking': True
    },
    {
        'title': 'Gold Prices Surge on Global Uncertainty',
        'description': 'Safe haven demand pushes gold prices to multi-month highs as global economic concerns persist.',
        'source': 'Reuters',
        'category': 'Economy',
        'image': 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
        'url': '#',
        'publishedAt': (datetime.now() - timedelta(hours=6)).isoformat(),
        'readTime': 4
    },
    {
        'title': 'Startup Funding Hits $2B in January 2026',
        'description': 'Indian startups continue to attract global investors with AI and fintech sectors leading the charge.',
        'source': 'YourStory',
        'category': 'Startups',
        'image': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
        'url': '#',
        'publishedAt': (datetime.now() - timedelta(hours=8)).isoformat(),
        'readTime': 6
    },
]

CATEGORIES = ['For You', 'All News', 'Markets', 'Crypto', 'Economy', 'Tech', 'Startups', 'World', 'Opinion', 'Video']


def get_news(category: str = None, limit: int = 20):
    """Fetch financial news, optionally filtered by category"""
    global _news_cache
    
    # Check cache first for faster loading
    if _news_cache['data'] and _news_cache['timestamp']:
        cache_age = datetime.now() - _news_cache['timestamp']
        if cache_age.total_seconds() < _news_cache['ttl_minutes'] * 60:
            # Return cached data (fast!)
            cached_news = _news_cache['data']
            if category and category not in ['For You', 'All News']:
                cached_news = [n for n in cached_news if n.get('category', '').lower() == category.lower()]
            return cached_news[:limit]
    
    # Try to fetch from NewsData.io if key is available
    if Config.NEWS_API_KEY:
        try:
            # Using NewsData.io API (for pub_ keys)
            url = 'https://newsdata.io/api/1/news'
            params = {
                'apikey': Config.NEWS_API_KEY,
                'category': 'business',
                'country': 'in',
                'language': 'en'
            }
            
            response = requests.get(url, params=params, timeout=15)
            data = response.json()
            
            if data.get('status') == 'success':
                articles = []
                for article in data.get('results', []):
                    # Skip articles with "ONLY AVAILABLE IN PAID PLANS" or no content
                    if not article.get('title') or 'PAID PLANS' in str(article.get('description', '')):
                        continue
                    
                    articles.append({
                        'title': article.get('title', ''),
                        'description': article.get('description', '') or (article.get('content', '')[:200] if article.get('content') else ''),
                        'source': article.get('source_id', 'Unknown').replace('_', ' ').title(),
                        'category': article.get('category', ['Markets'])[0] if article.get('category') else 'Markets',
                        'image': article.get('image_url', '') or 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
                        'url': article.get('link', '#'),
                        'publishedAt': article.get('pubDate', ''),
                        'readTime': random.randint(3, 10)
                    })
                
                if articles:
                    # Cache the results
                    _news_cache['data'] = articles
                    _news_cache['timestamp'] = datetime.now()
                    print(f"✅ Cached {len(articles)} news articles")
                    
                    if category and category not in ['For You', 'All News']:
                        articles = [n for n in articles if n.get('category', '').lower() == category.lower()]
                    return articles[:limit]
        except Exception as e:
            print(f"NewsData.io error: {e}")
    
    # Return mock news
    news = MOCK_NEWS.copy()
    
    if category and category not in ['For You', 'All News']:
        news = [n for n in news if n.get('category', '').lower() == category.lower()]
    
    return news[:limit]


def get_breaking_news():
    """Get top breaking news"""
    news = [n for n in MOCK_NEWS if n.get('isBreaking')]
    if not news:
        news = MOCK_NEWS[:1]
        news[0]['isBreaking'] = True
    return news


def get_trending_topics():
    """Get trending financial topics"""
    return [
        {'topic': 'RBI Policy', 'mentions': 2456},
        {'topic': 'Nifty 50', 'mentions': 1893},
        {'topic': 'Bitcoin ETF', 'mentions': 1567},
        {'topic': 'IPO 2026', 'mentions': 1234},
        {'topic': 'IT Stocks', 'mentions': 987},
    ]


def get_categories():
    """Get available news categories"""
    return CATEGORIES
