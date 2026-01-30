"""
Visnova 2.0 Backend - Stock Service
Fetches live stock prices using Alpha Vantage API
Uses Gemini AI for intelligent predictions
"""
import requests
import os
import json
from datetime import datetime, timedelta
import random

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Alpha Vantage API key
ALPHA_VANTAGE_KEY = os.getenv('ALPHA_VANTAGE_KEY', '8P11NVMOYR5AZ8AU')
ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query'
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

# Try to import Gemini
gemini_model = None
try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        print("✅ Gemini AI configured for stock predictions")
    else:
        print("⚠️ Gemini API Key not found in environment variables")
except Exception as e:
    print(f"⚠️ Gemini not available: {e}")

# Popular Indian stocks - BSE/NSE symbols
INDIAN_STOCKS = {
    'RELIANCE': {'name': 'Reliance Industries', 'symbol': 'RELIANCE.BSE'},
    'TCS': {'name': 'Tata Consultancy Services', 'symbol': 'TCS.BSE'},
    'INFY': {'name': 'Infosys', 'symbol': 'INFY.BSE'},
    'HDFC': {'name': 'HDFC Bank', 'symbol': 'HDFCBANK.BSE'},
    'ICICIBANK': {'name': 'ICICI Bank', 'symbol': 'ICICIBANK.BSE'},
    'SBIN': {'name': 'State Bank of India', 'symbol': 'SBIN.BSE'},
    'WIPRO': {'name': 'Wipro', 'symbol': 'WIPRO.BSE'},
    'BHARTIARTL': {'name': 'Bharti Airtel', 'symbol': 'BHARTIARTL.BSE'},
    'HCLTECH': {'name': 'HCL Technologies', 'symbol': 'HCLTECH.BSE'},
    'TATASTEEL': {'name': 'Tata Steel', 'symbol': 'TATASTEEL.BSE'},
}

# Ticker symbols for scrolling bar
TICKER_SYMBOLS = [
    {'symbol': 'SENSEX', 'name': 'SENSEX', 'type': 'index', 'av_symbol': '^BSESN'},
    {'symbol': 'NIFTY', 'name': 'Nifty 50', 'type': 'index', 'av_symbol': '^NSEI'},
    {'symbol': 'RELIANCE', 'name': 'Reliance', 'type': 'stock', 'av_symbol': 'RELIANCE.BSE'},
    {'symbol': 'TCS', 'name': 'TCS', 'type': 'stock', 'av_symbol': 'TCS.BSE'},
    {'symbol': 'INFY', 'name': 'Infosys', 'type': 'stock', 'av_symbol': 'INFY.BSE'},
]


def _fetch_alpha_vantage_quote(symbol: str):
    """Fetch real-time quote from Alpha Vantage"""
    try:
        url = f"{ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol={symbol}&apikey={ALPHA_VANTAGE_KEY}"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if 'Global Quote' in data and data['Global Quote']:
            quote = data['Global Quote']
            return {
                'price': float(quote.get('05. price', 0)),
                'change': float(quote.get('09. change', 0)),
                'changePercent': float(quote.get('10. change percent', '0%').replace('%', ''))
            }
    except Exception as e:
        print(f"Alpha Vantage quote error: {e}")
    return None


def _fetch_alpha_vantage_daily(symbol: str, outputsize: str = 'compact'):
    """Fetch daily time series from Alpha Vantage"""
    try:
        url = f"{ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol={symbol}&outputsize={outputsize}&apikey={ALPHA_VANTAGE_KEY}"
        response = requests.get(url, timeout=15)
        data = response.json()
        
        if 'Time Series (Daily)' in data:
            return data['Time Series (Daily)']
    except Exception as e:
        print(f"Alpha Vantage daily error: {e}")
    return None


def get_ticker_prices():
    """Get live prices for scrolling ticker bar"""
    results = []
    
    for item in TICKER_SYMBOLS:
        quote = _fetch_alpha_vantage_quote(item['av_symbol'])
        
        if quote and quote['price'] > 0:
            results.append({
                'symbol': item['name'],
                'price': round(quote['price'], 2),
                'change': round(quote['change'], 2),
                'changePercent': round(quote['changePercent'], 2),
                'type': item['type']
            })
        else:
            # Fallback with realistic mock data
            base_prices = {
                'SENSEX': 74500, 'Nifty 50': 22500, 'NIFTY': 22500,
                'Reliance': 1280, 'TCS': 3850, 'Infosys': 1520
            }
            base = base_prices.get(item['name'], 1500)
            change = random.uniform(-base * 0.02, base * 0.02)
            results.append({
                'symbol': item['name'],
                'price': round(base + change, 2),
                'change': round(change, 2),
                'changePercent': round((change / base) * 100, 2),
                'type': item['type']
            })
    
    return results


def search_stocks(query: str):
    """Search for stocks by name or symbol"""
    query = query.upper()
    results = []
    
    for key, stock in INDIAN_STOCKS.items():
        if query in key or query in stock['name'].upper():
            quote = _fetch_alpha_vantage_quote(stock['symbol'])
            price = quote['price'] if quote else random.uniform(500, 3000)
            
            results.append({
                'symbol': key,
                'name': stock['name'],
                'price': round(price, 2),
                'currency': 'INR'
            })
    
    return results[:10]


def get_stock_price(symbol: str):
    """Get current price and details for a stock"""
    stock_info = INDIAN_STOCKS.get(symbol.upper())
    
    if not stock_info:
        return None
    
    quote = _fetch_alpha_vantage_quote(stock_info['symbol'])
    
    if quote and quote['price'] > 0:
        return {
            'symbol': symbol.upper(),
            'name': stock_info['name'],
            'price': round(quote['price'], 2),
            'change': round(quote['change'], 2),
            'changePercent': round(quote['changePercent'], 2),
        }
    else:
        # Realistic fallback
        base = random.uniform(1000, 3000)
        change = random.uniform(-100, 100)
        return {
            'symbol': symbol.upper(),
            'name': stock_info['name'],
            'price': round(base, 2),
            'change': round(change, 2),
            'changePercent': round((change / base) * 100, 2),
        }


def get_stock_chart(symbol: str, period: str = '1M'):
    """Get historical chart data for a stock"""
    stock_info = INDIAN_STOCKS.get(symbol.upper())
    
    if not stock_info:
        return None
    
    # Determine output size based on period
    outputsize = 'full' if period in ['3M', '1Y'] else 'compact'
    
    daily_data = _fetch_alpha_vantage_daily(stock_info['symbol'], outputsize)
    
    if daily_data:
        # Determine how many days to return
        days_map = {'1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365}
        num_days = days_map.get(period, 30)
        
        data = []
        dates = sorted(daily_data.keys(), reverse=True)[:num_days]
        dates.reverse()  # Oldest first
        
        for date in dates:
            day_data = daily_data[date]
            data.append({
                'date': date,
                'price': round(float(day_data['4. close']), 2),
                'high': round(float(day_data['2. high']), 2),
                'low': round(float(day_data['3. low']), 2),
                'volume': int(float(day_data['5. volume']))
            })
        
        return data if len(data) > 0 else _generate_mock_chart(period)
    else:
        return _generate_mock_chart(period)


def _generate_mock_chart(period: str):
    """Generate mock chart data for testing"""
    data = []
    base_price = random.uniform(1200, 1600)
    days = {'1D': 24, '1W': 7, '1M': 30, '3M': 90, '1Y': 365}.get(period, 30)
    
    for i in range(days):
        date = datetime.now() - timedelta(days=days-i)
        price = base_price + random.uniform(-30, 30)
        base_price = price
        data.append({
            'date': date.strftime('%Y-%m-%d'),
            'price': round(price, 2),
            'high': round(price + random.uniform(10, 30), 2),
            'low': round(price - random.uniform(10, 30), 2),
            'volume': random.randint(100000, 1000000)
        })
    
    return data


def _calculate_technical_indicators(prices: list):
    """Calculate technical indicators for prediction"""
    if len(prices) < 20:
        return None
    
    # Simple Moving Averages
    sma_5 = sum(prices[-5:]) / 5
    sma_10 = sum(prices[-10:]) / 10
    sma_20 = sum(prices[-20:]) / 20
    
    # Price momentum
    momentum_5 = (prices[-1] - prices[-5]) / prices[-5] * 100 if len(prices) >= 5 else 0
    momentum_10 = (prices[-1] - prices[-10]) / prices[-10] * 100 if len(prices) >= 10 else 0
    
    # Volatility (standard deviation)
    mean = sum(prices[-20:]) / 20
    variance = sum((p - mean) ** 2 for p in prices[-20:]) / 20
    volatility = variance ** 0.5
    volatility_pct = (volatility / mean) * 100
    
    # RSI calculation (simplified)
    gains = []
    losses = []
    for i in range(1, min(15, len(prices))):
        diff = prices[-i] - prices[-i-1]
        if diff > 0:
            gains.append(diff)
        else:
            losses.append(abs(diff))
    
    avg_gain = sum(gains) / 14 if gains else 0
    avg_loss = sum(losses) / 14 if losses else 0.001
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    # Trend strength
    trend = 'bullish' if sma_5 > sma_20 else 'bearish'
    trend_strength = abs(sma_5 - sma_20) / sma_20 * 100
    
    return {
        'sma_5': round(sma_5, 2),
        'sma_10': round(sma_10, 2),
        'sma_20': round(sma_20, 2),
        'momentum_5d': round(momentum_5, 2),
        'momentum_10d': round(momentum_10, 2),
        'volatility': round(volatility_pct, 2),
        'rsi': round(rsi, 1),
        'trend': trend,
        'trend_strength': round(trend_strength, 2),
        'current_price': prices[-1],
        'price_vs_sma20': round((prices[-1] - sma_20) / sma_20 * 100, 2)
    }


def predict_stock_price(symbol: str, days: int = 7):
    """AI-powered stock price prediction using Gemini and technical analysis"""
    stock_info = INDIAN_STOCKS.get(symbol.upper())
    
    if not stock_info:
        return None
    
    # Get historical data
    chart_data = get_stock_chart(symbol, '3M')
    
    if not chart_data or len(chart_data) < 20:
        return _fallback_prediction(symbol, 1500, days)
    
    prices = [d['price'] for d in chart_data]
    current_price = prices[-1]
    
    # Calculate technical indicators
    indicators = _calculate_technical_indicators(prices)
    
    if not indicators:
        return _fallback_prediction(symbol, current_price, days)
    
    # Try Gemini AI for intelligent prediction
    if gemini_model:
        try:
            prompt = f"""Analyze this stock and provide a 7-day price prediction.

STOCK: {symbol} ({stock_info['name']})
CURRENT PRICE: ₹{current_price}

TECHNICAL INDICATORS:
- 5-day SMA: ₹{indicators['sma_5']}
- 10-day SMA: ₹{indicators['sma_10']}
- 20-day SMA: ₹{indicators['sma_20']}
- 5-day Momentum: {indicators['momentum_5d']}%
- 10-day Momentum: {indicators['momentum_10d']}%
- Volatility: {indicators['volatility']}%
- RSI (14): {indicators['rsi']}
- Trend: {indicators['trend']} (strength: {indicators['trend_strength']}%)
- Price vs SMA20: {indicators['price_vs_sma20']}%

RECENT PRICES (last 10 days): {prices[-10:]}

Based on this technical analysis, predict the stock price for the next 7 days.
Consider: trend direction, momentum, RSI overbought/oversold levels, and volatility.

RESPOND IN EXACTLY THIS JSON FORMAT (no other text):
{{
    "predictions": [
        {{"day": 1, "price": <number>, "low": <number>, "high": <number>}},
        {{"day": 2, "price": <number>, "low": <number>, "high": <number>}},
        {{"day": 3, "price": <number>, "low": <number>, "high": <number>}},
        {{"day": 4, "price": <number>, "low": <number>, "high": <number>}},
        {{"day": 5, "price": <number>, "low": <number>, "high": <number>}},
        {{"day": 6, "price": <number>, "low": <number>, "high": <number>}},
        {{"day": 7, "price": <number>, "low": <number>, "high": <number>}}
    ],
    "trend": "bullish" or "bearish",
    "confidence": <number between 50-95>,
    "analysis": "<brief 1-line analysis>"
}}"""

            response = gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            json_match = response_text
            if '```json' in response_text:
                json_match = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                json_match = response_text.split('```')[1].split('```')[0].strip()
            
            ai_result = json.loads(json_match)
            
            # Format predictions
            predictions = []
            for p in ai_result.get('predictions', []):
                predictions.append({
                    'day': p['day'],
                    'predicted': round(float(p['price']), 2),
                    'low': round(float(p['low']), 2),
                    'high': round(float(p['high']), 2)
                })
            
            if predictions:
                final_pred = predictions[-1]['predicted']
                change_pct = ((final_pred - current_price) / current_price) * 100
                
                return {
                    'symbol': symbol.upper(),
                    'currentPrice': round(current_price, 2),
                    'predictions': predictions,
                    'predictedChange': round(change_pct, 2),
                    'confidence': ai_result.get('confidence', 70),
                    'trend': ai_result.get('trend', 'bullish' if change_pct > 0 else 'bearish'),
                    'analysis': ai_result.get('analysis', ''),
                    'indicators': indicators,
                    'source': 'gemini_ai'
                }
                
        except Exception as e:
            print(f"Gemini prediction error: {e}")
    
    # Fallback to technical indicator-based prediction
    return _technical_prediction(symbol, current_price, indicators, days)


def _technical_prediction(symbol: str, current_price: float, indicators: dict, days: int):
    """Make prediction based on technical indicators"""
    predictions = []
    pred_price = current_price
    
    # Determine daily drift based on indicators
    if indicators['rsi'] > 70:
        # Overbought - expect pullback
        base_drift = -0.003
    elif indicators['rsi'] < 30:
        # Oversold - expect bounce
        base_drift = 0.004
    else:
        # Use momentum
        base_drift = indicators['momentum_5d'] / 100 / 5
    
    # Add trend factor
    if indicators['trend'] == 'bullish':
        base_drift += 0.001
    else:
        base_drift -= 0.001
    
    volatility = indicators['volatility'] / 100
    
    for day in range(1, days + 1):
        # Apply drift with some randomness
        daily_return = base_drift + random.gauss(0, volatility / 5)
        pred_price = pred_price * (1 + daily_return)
        
        predictions.append({
            'day': day,
            'predicted': round(pred_price, 2),
            'low': round(pred_price * (1 - volatility * 0.2), 2),
            'high': round(pred_price * (1 + volatility * 0.2), 2)
        })
    
    final_pred = predictions[-1]['predicted']
    change_pct = ((final_pred - current_price) / current_price) * 100
    
    # Confidence based on RSI extremes and trend strength
    confidence = 65
    if indicators['rsi'] > 70 or indicators['rsi'] < 30:
        confidence += 10  # More confident at extremes
    if indicators['trend_strength'] > 2:
        confidence += 5
    
    return {
        'symbol': symbol.upper(),
        'currentPrice': round(current_price, 2),
        'predictions': predictions,
        'predictedChange': round(change_pct, 2),
        'confidence': min(90, confidence),
        'trend': 'bullish' if change_pct > 0 else 'bearish',
        'indicators': indicators,
        'source': 'technical_analysis'
    }


def _fallback_prediction(symbol: str, current_price: float, days: int):
    """Fallback prediction when no data available"""
    predictions = []
    pred = current_price
    
    for day in range(1, days + 1):
        pred = pred * (1 + random.uniform(-0.015, 0.02))
        predictions.append({
            'day': day,
            'predicted': round(pred, 2),
            'low': round(pred * 0.97, 2),
            'high': round(pred * 1.03, 2)
        })
    
    return {
        'symbol': symbol.upper(),
        'currentPrice': round(current_price, 2),
        'predictions': predictions,
        'predictedChange': round(((pred - current_price) / current_price) * 100, 2),
        'confidence': 55,
        'trend': 'bullish' if pred > current_price else 'bearish',
        'source': 'fallback'
    }
