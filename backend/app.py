"""
Visnova 2.0 Backend - Main Flask Application
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config

# Import services
from services.stock_service import (
    get_ticker_prices,
    search_stocks,
    get_stock_price,
    get_stock_chart,
    predict_stock_price,
    INDIAN_STOCKS
)
from services.news_service import (
    get_news,
    get_breaking_news,
    get_trending_topics,
    get_categories
)
from services.terminal_service import run_calculation, CALCULATORS
from services.ai_service import chat, get_suggestions

# Create Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app, origins=Config.CORS_ORIGINS)


# ========== HEALTH CHECK ==========
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'version': '2.0.0',
        'name': 'Visnova Backend'
    })


# ========== STOCK TICKER ==========
@app.route('/api/ticker/prices', methods=['GET'])
def api_ticker_prices():
    """Get live prices for scrolling ticker"""
    prices = get_ticker_prices()
    return jsonify({'prices': prices})


# ========== STOCKS ==========
@app.route('/api/stocks/search', methods=['GET'])
def api_search_stocks():
    """Search for stocks"""
    query = request.args.get('q', '')
    if not query:
        return jsonify({'stocks': list(INDIAN_STOCKS.keys())})
    
    results = search_stocks(query)
    return jsonify({'stocks': results})


@app.route('/api/stocks/<symbol>/price', methods=['GET'])
def api_stock_price(symbol):
    """Get current price for a stock"""
    price = get_stock_price(symbol)
    if not price:
        return jsonify({'error': 'Stock not found'}), 404
    return jsonify(price)


@app.route('/api/stocks/<symbol>/chart', methods=['GET'])
def api_stock_chart(symbol):
    """Get chart data for a stock"""
    period = request.args.get('period', '1M')
    chart = get_stock_chart(symbol, period)
    if not chart:
        return jsonify({'error': 'Stock not found'}), 404
    return jsonify({'symbol': symbol, 'period': period, 'data': chart})


@app.route('/api/stocks/predict', methods=['POST'])
def api_predict_stock():
    """Predict stock price using AI"""
    data = request.json or {}
    symbol = data.get('symbol', 'RELIANCE')
    days = data.get('days', 7)
    
    prediction = predict_stock_price(symbol, days)
    if not prediction:
        return jsonify({'error': 'Stock not found'}), 404
    return jsonify(prediction)


# ========== NEWS ==========
@app.route('/api/news', methods=['GET'])
def api_news():
    """Get financial news"""
    category = request.args.get('category')
    limit = int(request.args.get('limit', 20))
    news = get_news(category, limit)
    return jsonify({'news': news, 'category': category})


@app.route('/api/news/breaking', methods=['GET'])
def api_breaking_news():
    """Get breaking news"""
    news = get_breaking_news()
    return jsonify({'breaking': news})


@app.route('/api/news/trending', methods=['GET'])
def api_trending():
    """Get trending topics"""
    topics = get_trending_topics()
    return jsonify({'trending': topics})


@app.route('/api/news/categories', methods=['GET'])
def api_news_categories():
    """Get news categories"""
    categories = get_categories()
    return jsonify({'categories': categories})


# ========== TERMINAL ==========
@app.route('/api/terminal/calculators', methods=['GET'])
def api_calculators():
    """Get available calculators"""
    return jsonify({'calculators': list(CALCULATORS.keys())})


@app.route('/api/terminal/calculate', methods=['POST'])
def api_calculate():
    """Run a financial calculation"""
    data = request.json or {}
    calc_type = data.get('type', 'sip')
    params = data.get('params', {})
    
    result = run_calculation(calc_type, params)
    return jsonify(result)


# ========== AI CHAT ==========
@app.route('/api/chat', methods=['POST'])
def api_chat():
    """Send message to AI assistant"""
    data = request.json or {}
    message = data.get('message', '')
    page = data.get('page', 'dashboard')
    user_data = data.get('userData')
    history = data.get('history', [])
    
    if not message:
        return jsonify({'error': 'Message required'}), 400
    
    response = chat(message, page, user_data, history)
    return jsonify(response)


@app.route('/api/chat/suggestions', methods=['GET'])
def api_chat_suggestions():
    """Get AI suggestions for current page"""
    page = request.args.get('page', 'dashboard')
    suggestions = get_suggestions(page)
    return jsonify({'suggestions': suggestions, 'page': page})


# ========== ERROR HANDLERS ==========
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


# ========== RUN ==========
if __name__ == '__main__':
    print("🚀 Visnova 2.0 Backend starting...")
    print("📊 Endpoints available:")
    print("   GET  /api/ticker/prices")
    print("   GET  /api/stocks/search")
    print("   POST /api/stocks/predict")
    print("   GET  /api/news")
    print("   POST /api/terminal/calculate")
    print("   POST /api/chat")
    print("-" * 40)
    app.run(debug=Config.DEBUG, port=5000)
