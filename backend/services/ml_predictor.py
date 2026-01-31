"""
Finova - Stock Prediction Pipeline
Uses momentum-continuation and trend analysis for realistic predictions
"""
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime


import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sklearn.svm import SVR
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

import os
import json
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import google.generativeai as genai
from config import Config

class StockPredictor:
    """
    Advanced Stock Predictor using Google Gemini API.
    Leverages LLM context window to analyze technicals and patterns.
    """
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY', Config.GEMINI_API_KEY if hasattr(Config, 'GEMINI_API_KEY') else None)
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
            print("⚠️ Gemini API Key missing for StockPredictor")

    def _calculate_indicators(self, prices: List[float]) -> Dict:
        """Calculate technical indicators for context"""
        if len(prices) < 14:
            return None
            
        current = prices[-1]
        returns = np.diff(prices) / prices[:-1]
        
        # Volatility (Annualized)
        volatility = np.std(returns) * np.sqrt(252) if len(returns) > 0 else 0
        
        # RSI
        deltas = np.diff(prices)
        seed = deltas[:14+1]
        up = seed[seed >= 0].sum()/14
        down = -seed[seed < 0].sum()/14
        rs = up/down if down != 0 else 0
        rsi = 100 - (100 / (1 + rs))
        
        return {
            'rsi': rsi,
            'volatility': volatility,
            'trend': 'bullish' if prices[-1] > prices[-20] else 'bearish',
            'change_1m': ((prices[-1] - prices[-30]) / prices[-30]) * 100 if len(prices) >= 30 else 0
        }

    def predict(self, prices: List[float], forecast_days: int = 7) -> Dict:
        """
        Generate forecast using Gemini API
        """
        if len(prices) < 30:
            return self._simple_prediction(prices, forecast_days)

        indicators = self._calculate_indicators(prices)
        current_price = prices[-1]

        # PROMPT ENGINEERING
        history_str = ", ".join([f"{p:.1f}" for p in prices[-30:]]) # Last 30 days
        
        prompt = f"""
        Analyze this stock data for the Indian market context (₹).
        Current Price: ₹{current_price}
        Technical Indicators: 
        - RSI (14): {indicators['rsi']:.1f}
        - Volatility: {indicators['volatility']*100:.1f}%
        - 30-Day Change: {indicators['change_1m']:.1f}%
        
        Past 30 Days Price History: [{history_str}]
        
        TASK: Predict the stock price for the next {forecast_days} days.
        - Use simple moving average and RSI to determine short term reversal or continuation.
        - Be realistic. Stocks rarely move more than 2-3% a day unless volatile.
        - Return ONLY raw JSON. No markdown.
        
        JSON Format:
        {{
            "predictions": [
                {{ "day": 1, "predicted": <price>, "low": <support>, "high": <resistance> }},
                ... for all 7 days
            ],
            "predictedChange": <total_pct_change_7d>,
            "confidence": <0-100 integer based on clarity of trend>,
            "trend": "bullish" | "bearish" | "neutral",
            "reasoning": "<short sentence explaining why>"
        }}
        """

        try:
            if not self.model:
                raise Exception("Model not initialized")

            response = self.model.generate_content(prompt)
            text = response.text.replace('```json', '').replace('```', '').strip()
            data = json.loads(text)
            
            # Format output to match interface
            predicted_change = float(data['predictedChange'])
            
            # Cap unrealistic predictions to ±5% max for 7 days
            predicted_change = max(-5, min(5, predicted_change))
            
            # ALWAYS recalculate predictions based on current price and capped change
            current = prices[-1]
            daily_change = predicted_change / 7 / 100
            new_predictions = []
            val = current
            for day in range(1, 8):
                val = val * (1 + daily_change)
                new_predictions.append({
                    'day': day,
                    'predicted': round(val, 2),
                    'low': round(val * 0.995, 2),
                    'high': round(val * 1.005, 2)
                })
            
            # Determine trend from capped change
            if predicted_change > 1:
                trend = 'bullish'
            elif predicted_change < -1:
                trend = 'bearish'
            else:
                trend = 'neutral'
            
            result = {
                'predictions': new_predictions,
                'predictedChange': round(predicted_change, 2),
                'confidence': min(int(data.get('confidence', 60)), 75),  # Cap confidence
                'trend': trend,
                'source': 'Gemini 1.5 Flash',
                'indicators': {
                    'rsi': round(indicators['rsi'], 1),
                    'macd': 0,
                    'volatility': round(indicators['volatility'] * 100, 1),
                    'trendStrength': abs(predicted_change) / 10
                }
            }
            return result

        except Exception as e:
            print(f"Gemini Prediction Error: {e}")
            return self._simple_prediction(prices, forecast_days)

    def _simple_prediction(self, prices: List[float], forecast_days: int) -> Dict:
        """Fallback momentum prediction - conservative approach"""
        current_price = prices[-1]
        
        # Calculate momentum from last 5 days, cap to ±2% momentum
        momentum = (prices[-1] - prices[-5]) / prices[-5] if len(prices) > 5 else 0
        momentum = np.clip(momentum, -0.02, 0.02)  # Very conservative
        
        predictions = []
        val = current_price
        
        for day in range(1, forecast_days + 1):
            # Small daily movement (momentum spread over 7 days with damping)
            daily_change = momentum / forecast_days * 0.7  # 70% damping
            val = val * (1 + daily_change)
            predictions.append({
                'day': day,
                'predicted': round(val, 2),
                'low': round(val * 0.99, 2),
                'high': round(val * 1.01, 2)
            })
            
        change_pct = ((val - current_price) / current_price) * 100
        # Final cap to ±5%
        change_pct = np.clip(change_pct, -5, 5)
        
        return {
            'predictions': predictions,
            'predictedChange': round(change_pct, 2),
            'confidence': 55,
            'trend': 'bullish' if change_pct > 0.5 else 'bearish' if change_pct < -0.5 else 'neutral',
            'source': 'Simple Momentum',
            'indicators': {'rsi': 50, 'macd': 0, 'volatility': 0}
        }


# Singleton instance
_predictor = StockPredictor()


def predict_with_ml(prices: List[float], symbol: str = '', days: int = 7) -> Dict:
    """
    Main function to get predictions.
    Uses momentum-continuation approach.
    """
    if not prices or len(prices) < 2:
        return None
    
    result = _predictor.predict(prices, days)
    
    if result:
        result['symbol'] = symbol.upper()
        result['currentPrice'] = round(prices[-1], 2)
    
    return result
