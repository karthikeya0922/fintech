"""
Visnova 2.0 Backend - Services Package
"""
from .stock_service import (
    get_ticker_prices,
    search_stocks,
    get_stock_price,
    get_stock_chart,
    predict_stock_price,
    INDIAN_STOCKS
)
from .news_service import (
    get_news,
    get_breaking_news,
    get_trending_topics,
    get_categories
)
from .terminal_service import run_calculation, CALCULATORS
from .ai_service import chat, get_suggestions
