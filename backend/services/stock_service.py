"""
Finova - Stock Service
Fetches live stock prices using Alpha Vantage API
Uses ML pipeline for intelligent predictions
"""
import requests
import os
import json
from datetime import datetime, timedelta
import random

# Import ML predictor
try:
    from services.ml_predictor import predict_with_ml
    HAS_ML_PREDICTOR = True
    print("✅ ML Predictor loaded")
except ImportError:
    HAS_ML_PREDICTOR = False
    print("⚠️ ML Predictor not available")

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Alpha Vantage API key
ALPHA_VANTAGE_KEY = os.getenv('ALPHA_VANTAGE_KEY', 'bf57a61fd6d4b0fa71e43af0795bb56c1f1e1c1a')
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

# Try to import yfinance for accurate stock data
try:
    import yfinance as yf
    HAS_YFINANCE = True
    print("✅ yfinance loaded for real-time stock data")
except ImportError:
    HAS_YFINANCE = False
    print("⚠️ yfinance not installed. Run: pip install yfinance")

# Popular Indian stocks - NSE symbols (more accurate than BSE)
INDIAN_STOCKS = {
    'RELIANCE': {'name': 'Reliance Industries', 'symbol': 'RELIANCE.NS'},
    'TCS': {'name': 'Tata Consultancy Services', 'symbol': 'TCS.NS'},
    'INFY': {'name': 'Infosys', 'symbol': 'INFY.NS'},
    'HDFCBANK': {'name': 'HDFC Bank', 'symbol': 'HDFCBANK.NS'},
    'ICICIBANK': {'name': 'ICICI Bank', 'symbol': 'ICICIBANK.NS'},
    'SBIN': {'name': 'State Bank of India', 'symbol': 'SBIN.NS'},
    'WIPRO': {'name': 'Wipro', 'symbol': 'WIPRO.NS'},
    'BHARTIARTL': {'name': 'Bharti Airtel', 'symbol': 'BHARTIARTL.NS'},
    'HCLTECH': {'name': 'HCL Technologies', 'symbol': 'HCLTECH.NS'},
    'TATASTEEL': {'name': 'Tata Steel', 'symbol': 'TATASTEEL.NS'},
    'LT': {'name': 'Larsen & Toubro', 'symbol': 'LT.NS'},
    'MARUTI': {'name': 'Maruti Suzuki', 'symbol': 'MARUTI.NS'},
    'TITAN': {'name': 'Titan Company', 'symbol': 'TITAN.NS'},
    'BAJFINANCE': {'name': 'Bajaj Finance', 'symbol': 'BAJFINANCE.NS'},
    'ASIANPAINT': {'name': 'Asian Paints', 'symbol': 'ASIANPAINT.NS'},
}

# Ticker symbols for scrolling bar (using NSE symbols)
TICKER_SYMBOLS = [
    {'symbol': 'SENSEX', 'name': 'SENSEX', 'type': 'index', 'yf_symbol': '^BSESN'},
    {'symbol': 'NIFTY', 'name': 'Nifty 50', 'type': 'index', 'yf_symbol': '^NSEI'},
    {'symbol': 'RELIANCE', 'name': 'Reliance', 'type': 'stock', 'yf_symbol': 'RELIANCE.NS'},
    {'symbol': 'TCS', 'name': 'TCS', 'type': 'stock', 'yf_symbol': 'TCS.NS'},
    {'symbol': 'INFY', 'name': 'Infosys', 'type': 'stock', 'yf_symbol': 'INFY.NS'},
    {'symbol': 'HDFCBANK', 'name': 'HDFC Bank', 'type': 'stock', 'yf_symbol': 'HDFCBANK.NS'},
]

# Price cache to reduce API calls (cache for 30 seconds)
_price_cache = {}
_cache_timeout = 30  # seconds


def _fetch_yfinance_quote(symbol: str):
    """Fetch real-time quote using yfinance with caching"""
    if not HAS_YFINANCE:
        return None
    
    # Check cache first
    import time
    cache_key = symbol
    if cache_key in _price_cache:
        cached_data, cached_time = _price_cache[cache_key]
        if time.time() - cached_time < _cache_timeout:
            return cached_data
    
    try:
        ticker = yf.Ticker(symbol)
        
        # Method 1: Try fast_info first (most recent)
        try:
            fast = ticker.fast_info
            if hasattr(fast, 'last_price') and fast.last_price and fast.last_price > 0:
                prev_close = fast.previous_close if hasattr(fast, 'previous_close') else fast.last_price
                price = fast.last_price
                change = price - prev_close
                change_pct = (change / prev_close * 100) if prev_close > 0 else 0
                result = {
                    'price': float(price),
                    'change': float(change),
                    'changePercent': float(change_pct),
                    'high': float(fast.day_high) if hasattr(fast, 'day_high') and fast.day_high else price,
                    'low': float(fast.day_low) if hasattr(fast, 'day_low') and fast.day_low else price,
                    'volume': int(fast.last_volume) if hasattr(fast, 'last_volume') and fast.last_volume else 0
                }
                _price_cache[cache_key] = (result, time.time())
                return result
        except Exception as e:
            print(f"fast_info failed for {symbol}: {e}")
        
        # Method 2: Use latest history data (most accurate for intraday)
        try:
            hist = ticker.history(period='1d', interval='1m')
            if not hist.empty:
                latest = hist.iloc[-1]
                price = float(latest['Close'])
                prev_close = float(hist.iloc[0]['Open'])
                change = price - prev_close
                change_pct = (change / prev_close * 100) if prev_close > 0 else 0
                result = {
                    'price': price,
                    'change': change,
                    'changePercent': change_pct,
                    'high': float(hist['High'].max()),
                    'low': float(hist['Low'].min()),
                    'volume': int(hist['Volume'].sum())
                }
                _price_cache[cache_key] = (result, time.time())
                return result
        except Exception as e:
            print(f"1d history failed for {symbol}: {e}")
        
        # Method 3: Fallback to info
        info = ticker.info
        price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose', 0)
        prev_close = info.get('previousClose', price)
        
        if price and price > 0:
            change = price - prev_close
            change_pct = (change / prev_close * 100) if prev_close > 0 else 0
            result = {
                'price': float(price),
                'change': float(change),
                'changePercent': float(change_pct),
                'high': float(info.get('dayHigh', price)),
                'low': float(info.get('dayLow', price)),
                'volume': int(info.get('volume', 0))
            }
            _price_cache[cache_key] = (result, time.time())
            return result
    except Exception as e:
        print(f"yfinance quote error for {symbol}: {e}")
    return None


def _fetch_yfinance_history(symbol: str, period: str = '3mo'):
    """Fetch historical data using yfinance"""
    if not HAS_YFINANCE:
        return None
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        
        if not hist.empty:
            data = []
            for date, row in hist.iterrows():
                data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'price': float(row['Close']),
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'volume': int(row['Volume'])
                })
            return data
    except Exception as e:
        print(f"yfinance history error for {symbol}: {e}")
    return None


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


# Optimized Parallel Fetching
import asyncio
import aiohttp

async def fetch_price_async(session, symbol):
    """Async fetch for a single stock"""
    try:
        # For Indian stocks, ensure .NS suffix
        search_symbol = symbol
        if symbol in ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'SBIN', 'ICICIBANK'] and not symbol.endswith('.NS'):
            search_symbol = f"{symbol}.NS"
            
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{search_symbol}?interval=1d&range=1d"
        headers = {'User-Agent': 'Mozilla/5.0'}
        
        async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=3)) as response:
            if response.status == 200:
                data = await response.json()
                result = data['chart']['result'][0]
                meta = result['meta']
                price = meta.get('regularMarketPrice') or meta.get('chartPreviousClose')
                prev_close = meta.get('chartPreviousClose', price)
                
                return {
                    'symbol': symbol,
                    'price': price,
                    'change': price - prev_close,
                    'changePercent': ((price - prev_close) / prev_close) * 100 if prev_close else 0
                }
    except:
        pass
    return None

async def get_all_prices_async(symbols):
    """Fetch all prices in parallel"""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_price_async(session, symbol) for symbol in symbols]
        return await asyncio.gather(*tasks)

def get_ticker_prices():
    """Get live prices using parallel async requests"""
    results = []
    
    # Extract symbols
    symbols_to_fetch = [item.get('yf_symbol', item['symbol']) for item in TICKER_SYMBOLS]
    
    # Run async fetch
    try:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        if loop.is_running():
            # If we are already in a loop (unlikely for Sync Flask but possible in some envs)
            # Just create new loop in new thread or use sync fallback. 
            # For simplicity in this script, we assume standard sync Flask.
            fetched_data = loop.run_until_complete(get_all_prices_async(symbols_to_fetch))
        else:
            fetched_data = loop.run_until_complete(get_all_prices_async(symbols_to_fetch))
            
    except Exception as e:
        print(f"Async fetch failed: {e}")
        fetched_data = [None] * len(symbols_to_fetch)
    
    # Create lookup map
    price_map = {}
    if fetched_data:
        for data in fetched_data:
            if data:
                price_map[data['symbol']] = data
                
    for item in TICKER_SYMBOLS:
        symbol_key = item.get('yf_symbol', item['symbol'])
        quote = price_map.get(symbol_key)
        
        if quote:
             results.append({
                'symbol': item['name'],
                'price': round(quote['price'], 2),
                'change': round(quote['change'], 2),
                'changePercent': round(quote['changePercent'], 2),
                'type': item['type']
            })
        else:

            # Skip if no data available (Real data only)
            continue
            
            
    return results


def get_batch_stock_prices(symbols: list):
    """Fetch multiple stock prices in parallel"""
    # Run async fetch
    try:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        if loop.is_running():
             # If already in async loop, this might block, but for Flask/sync it's usually fine
             # Ideally we'd use aiohttp directly in async views, but staying sync-compatible here
             import threading
             result = []
             def run_in_thread():
                 new_loop = asyncio.new_event_loop()
                 asyncio.set_event_loop(new_loop)
                 result.append(new_loop.run_until_complete(get_all_prices_async(symbols)))
                 new_loop.close()
             
             t = threading.Thread(target=run_in_thread)
             t.start()
             t.join()
             fetched_data = result[0]
        else:
            fetched_data = loop.run_until_complete(get_all_prices_async(symbols))
            
    except Exception as e:
        print(f"Async batch fetch failed: {e}")
        fetched_data = [None] * len(symbols)
        
    # Map to result format
    results = {}
    if fetched_data:
        for data in fetched_data:
            if data:
                stock_info = INDIAN_STOCKS.get(data['symbol'].replace('.NS', ''), {'name': data['symbol']})
                results[data['symbol'].replace('.NS', '')] = {
                    'symbol': data['symbol'].replace('.NS', ''),
                    'name': stock_info['name'],
                    'price': round(data['price'], 2),
                    'changePercent': round(data['changePercent'], 2)
                }
    return results


def search_stocks(query: str):
    """Search for stocks by name or symbol"""
    query = query.upper()
    results = []
    
    for key, stock in INDIAN_STOCKS.items():
        if query in key or query in stock['name'].upper():
            # Try yfinance first for accurate price
            quote = None
            if HAS_YFINANCE:
                quote = _fetch_yfinance_quote(stock['symbol'])
            
            if not quote:
                quote = _fetch_alpha_vantage_quote(stock['symbol'])
            
            price = quote['price'] if quote else 0
            
            results.append({
                'symbol': key,
                'name': stock['name'],
                'price': round(price, 2),
                'currency': 'INR'
            })
    
    return results[:10]


# Optimized get_stock_price with caching and direct API calls
import requests
import time

# Cache for 2 minutes
price_cache = {}
CACHE_EXPIRY = 120  # seconds

def get_stock_price(symbol: str):
    """Get current price using fast Yahoo Finance API with caching"""
    # Check cache first
    if symbol in price_cache:
        price, timestamp = price_cache[symbol]
        if time.time() - timestamp < CACHE_EXPIRY:
            stock_info = INDIAN_STOCKS.get(symbol.upper(), {'name': symbol})
            return {
                'symbol': symbol.upper(),
                'name': stock_info['name'],
                'price': float(price),
                'change': 0,
                'changePercent': 0,
                'is_cached': True
            }
    
    # For Indian stocks, add .NS suffix if not present
    search_symbol = symbol
    if symbol in ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'SBIN', 'ICICIBANK'] or symbol in INDIAN_STOCKS:
        if not symbol.endswith('.NS'):
            search_symbol = f"{symbol}.NS"
            
    try:
        # Fast API with timeout
        # Using query1.finance.yahoo.com v8 chart API which is faster than scraping
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{search_symbol}?interval=1d&range=1d"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=3)  # 3 second timeout
        
        if response.status_code == 200:
            data = response.json()
            result = data['chart']['result'][0]
            meta = result['meta']
            price = meta.get('regularMarketPrice') or meta.get('chartPreviousClose')
            
            if price:
                # Cache the result
                price_cache[symbol] = (price, time.time())
                
                stock_info = INDIAN_STOCKS.get(symbol.upper(), {'name': symbol})
                
                # Calculate change more robustly
                prev_close = meta.get('chartPreviousClose') or meta.get('previousClose')
                
                change = 0
                change_percent = 0
                
                if prev_close and prev_close > 0:
                    change = price - prev_close
                    change_percent = (change / prev_close) * 100
                
                return {
                    'symbol': symbol.upper(),
                    'name': stock_info['name'],
                    'price': round(price, 2),
                    'change': round(change, 2),
                    'changePercent': round(change_percent, 2),
                    'high': round(price * 1.01, 2), # Approx
                    'low': round(price * 0.99, 2), # Approx
                    'volume': 0
                }
        
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        # Return cached value if available, even if expired
        if symbol in price_cache:
            price, _ = price_cache[symbol]
            stock_info = INDIAN_STOCKS.get(symbol.upper(), {'name': symbol})
            return {
                'symbol': symbol.upper(),
                'name': stock_info['name'],
                'price': round(price, 2), 
                'is_cached': True
            }
            
    return None


def get_stock_chart(symbol: str, period: str = '1M'):
    """Get historical chart data for a stock using yfinance"""
    stock_info = INDIAN_STOCKS.get(symbol.upper())
    
    if not stock_info:
        return None
    
    # Map period to yfinance format
    period_map = {'1D': '5d', '1W': '1mo', '1M': '1mo', '3M': '3mo', '1Y': '1y'}
    yf_period = period_map.get(period, '1mo')
    
    # Try yfinance first (accurate historical data)
    if HAS_YFINANCE:
        history = _fetch_yfinance_history(stock_info['symbol'], yf_period)
        if history and len(history) > 0:
            # Filter based on requested period
            days_map = {'1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365}
            num_days = days_map.get(period, 30)
            return history[-num_days:] if len(history) > num_days else history
    
    # Fallback to Alpha Vantage
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
    """ML-powered stock price prediction with technical analysis fallback"""
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
    
    # Try ML predictor first (most accurate)
    if HAS_ML_PREDICTOR and len(prices) >= 30:
        try:
            ml_result = predict_with_ml(prices, symbol, days)
            if ml_result and ml_result.get('predictions'):
                # Merge indicators if they exist
                if indicators:
                    ml_indicators = ml_result.get('indicators', {})
                    # Keep ML indicators, add missing ones from legacy
                    for k, v in indicators.items():
                        if k not in ml_indicators:
                            ml_indicators[k] = v
                    ml_result['indicators'] = ml_indicators
                
                ml_result['name'] = stock_info['name']
                print(f"✅ ML prediction for {symbol}: {ml_result['predictedChange']:.2f}%")
                return ml_result
        except Exception as e:
            print(f"⚠️ ML prediction failed: {e}")
    
    if not indicators:
        return _fallback_prediction(symbol, current_price, days)
    
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
