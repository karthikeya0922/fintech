/**
 * Visnova 2.0 - API Service
 * Connects frontend to Flask backend
 */

const API_BASE = 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error(`API call failed: ${endpoint}`, error);
        throw error;
    }
}

// ========== TICKER ==========
export interface TickerPrice {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    type: string;
}

export async function getTickerPrices(): Promise<TickerPrice[]> {
    const data = await apiCall<{ prices: TickerPrice[] }>('/ticker/prices');
    return data.prices;
}

// ========== STOCKS ==========
export interface Stock {
    symbol: string;
    name: string;
    price: number;
    currency: string;
}

export interface StockPrice {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
}

export interface ChartData {
    date: string;
    price: number;
    high: number;
    low: number;
    volume: number;
}

export interface Prediction {
    symbol: string;
    currentPrice: number;
    predictions: Array<{
        day: number;
        predicted: number;
        low: number;
        high: number;
    }>;
    predictedChange: number;
    confidence: number;
    trend: 'bullish' | 'bearish';
}

export async function searchStocks(query: string): Promise<Stock[]> {
    const data = await apiCall<{ stocks: Stock[] }>(`/stocks/search?q=${query}`);
    return data.stocks;
}

export async function getStockPrice(symbol: string): Promise<StockPrice> {
    return apiCall<StockPrice>(`/stocks/${symbol}/price`);
}

export async function getStockChart(symbol: string, period: string = '1M'): Promise<ChartData[]> {
    const data = await apiCall<{ data: ChartData[] }>(`/stocks/${symbol}/chart?period=${period}`);
    return data.data;
}

export async function predictStock(symbol: string, days: number = 7): Promise<Prediction> {
    return apiCall<Prediction>('/stocks/predict', {
        method: 'POST',
        body: JSON.stringify({ symbol, days }),
    });
}

// ========== NEWS ==========
export interface NewsArticle {
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

export async function getNews(category?: string, limit: number = 20): Promise<NewsArticle[]> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    params.set('limit', limit.toString());

    const data = await apiCall<{ news: NewsArticle[] }>(`/news?${params}`);
    return data.news;
}

export async function getBreakingNews(): Promise<NewsArticle[]> {
    const data = await apiCall<{ breaking: NewsArticle[] }>('/news/breaking');
    return data.breaking;
}

export async function getNewsCategories(): Promise<string[]> {
    const data = await apiCall<{ categories: string[] }>('/news/categories');
    return data.categories;
}

// ========== TERMINAL ==========
export interface CalculationResult {
    [key: string]: unknown;
    yearlyBreakdown?: Array<{ [key: string]: number }>;
    error?: string;
}

export async function calculate(type: string, params: Record<string, unknown>): Promise<CalculationResult> {
    return apiCall<CalculationResult>('/terminal/calculate', {
        method: 'POST',
        body: JSON.stringify({ type, params }),
    });
}

// ========== CHAT ==========
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    response: string;
    isCommand: boolean;
    command?: {
        action: string;
        variable?: string;
        value?: unknown;
        description: string;
    };
}

export async function sendChatMessage(
    message: string,
    page: string = 'dashboard',
    userData?: Record<string, unknown>,
    history?: ChatMessage[]
): Promise<ChatResponse> {
    return apiCall<ChatResponse>('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, page, userData, history }),
    });
}

export async function getChatSuggestions(page: string): Promise<string[]> {
    const data = await apiCall<{ suggestions: string[] }>(`/chat/suggestions?page=${page}`);
    return data.suggestions;
}
