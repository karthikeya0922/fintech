"""
Finova - Stock Prediction Pipeline
Uses momentum-continuation and trend analysis for realistic predictions
"""
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime


class StockPredictor:
    """Stock predictor using momentum-continuation and trend analysis"""
    
    def __init__(self):
        self.feature_names = []
    
    def _calculate_indicators(self, prices: List[float]) -> Dict:
        """Calculate technical indicators from price history"""
        if len(prices) < 20:
            return None
        
        current = prices[-1]
        
        # Moving averages
        sma_5 = np.mean(prices[-5:])
        sma_10 = np.mean(prices[-10:])
        sma_20 = np.mean(prices[-20:])
        
        # Returns/Momentum
        ret_1d = (prices[-1] - prices[-2]) / prices[-2] * 100 if prices[-2] > 0 else 0
        ret_5d = (prices[-1] - prices[-6]) / prices[-6] * 100 if len(prices) > 5 else 0
        ret_10d = (prices[-1] - prices[-11]) / prices[-11] * 100 if len(prices) > 10 else 0
        ret_20d = (prices[-1] - prices[-21]) / prices[-21] * 100 if len(prices) > 20 else 0
        
        # Volatility
        returns = [(prices[i] - prices[i-1]) / prices[i-1] for i in range(max(1, len(prices)-20), len(prices))]
        volatility = np.std(returns) if returns else 0.02
        
        # RSI
        gains = []
        losses = []
        for i in range(1, min(15, len(prices))):
            diff = prices[-i] - prices[-i-1]
            if diff > 0:
                gains.append(diff)
            else:
                losses.append(abs(diff))
        
        avg_gain = np.mean(gains) if gains else 0
        avg_loss = np.mean(losses) if losses else 0.001
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        # Trend direction
        trend_short = 1 if sma_5 > sma_10 else -1
        trend_long = 1 if sma_10 > sma_20 else -1
        
        # Price position
        high_20 = max(prices[-20:])
        low_20 = min(prices[-20:])
        range_pos = (current - low_20) / (high_20 - low_20) if high_20 > low_20 else 0.5
        
        return {
            'current': current,
            'sma_5': sma_5,
            'sma_10': sma_10,
            'sma_20': sma_20,
            'ret_1d': ret_1d,
            'ret_5d': ret_5d,
            'ret_10d': ret_10d,
            'ret_20d': ret_20d,
            'volatility': volatility,
            'rsi': rsi,
            'trend_short': trend_short,
            'trend_long': trend_long,
            'range_pos': range_pos
        }
    
    def predict(self, prices: List[float], forecast_days: int = 7) -> Dict:
        """
        Make predictions using momentum-continuation approach.
        Recent trend is more likely to continue than reverse.
        """
        if len(prices) < 25:
            return self._simple_prediction(prices, forecast_days)
        
        indicators = self._calculate_indicators(prices)
        if not indicators:
            return self._simple_prediction(prices, forecast_days)
        
        current_price = prices[-1]
        predictions = []
        pred_price = current_price
        
        # Calculate expected daily drift based on recent momentum
        # Use weighted average of different timeframes
        daily_drift = (
            indicators['ret_1d'] * 0.3 +      # Recent momentum matters most
            indicators['ret_5d'] / 5 * 0.4 +  # 5-day average momentum
            indicators['ret_10d'] / 10 * 0.2 + # 10-day average
            indicators['ret_20d'] / 20 * 0.1   # Long-term trend
        ) / 100  # Convert to decimal
        
        # Adjust based on RSI (mean reversion at extremes only)
        if indicators['rsi'] > 80:
            daily_drift -= 0.002  # Slight pullback expected
        elif indicators['rsi'] < 20:
            daily_drift += 0.002  # Slight bounce expected
        
        # Adjust based on trend alignment
        if indicators['trend_short'] == 1 and indicators['trend_long'] == 1:
            # Strong bullish trend - boost positive drift
            daily_drift = max(daily_drift, 0.001)
        elif indicators['trend_short'] == -1 and indicators['trend_long'] == -1:
            # Strong bearish trend
            daily_drift = min(daily_drift, -0.001)
        
        # Cap daily drift to realistic bounds (±1.5% typical, ±3% max)
        daily_drift = np.clip(daily_drift, -0.015, 0.015)
        
        # Add slight mean-reversion for stocks that have moved too much
        if indicators['range_pos'] > 0.9:  # Near 20-day high
            daily_drift -= 0.001
        elif indicators['range_pos'] < 0.1:  # Near 20-day low
            daily_drift += 0.001
        
        volatility = indicators['volatility']
        
        for day in range(1, forecast_days + 1):
            # Drift decays slightly over time (momentum effect weakens)
            decay = 1 - (day - 1) * 0.05
            effective_drift = daily_drift * decay
            
            # Add randomness based on volatility
            noise = np.random.randn() * volatility * 0.3
            daily_return = effective_drift + noise
            
            # Cap daily change
            daily_return = np.clip(daily_return, -0.03, 0.03)
            
            pred_price = pred_price * (1 + daily_return)
            
            # Confidence bands widen over time
            uncertainty = volatility * np.sqrt(day) * current_price * 1.5
            low = pred_price - uncertainty
            high = pred_price + uncertainty
            
            predictions.append({
                'day': day,
                'predicted': round(pred_price, 2),
                'low': round(max(low, current_price * 0.90), 2),
                'high': round(min(high, current_price * 1.10), 2)
            })
        
        final_pred = predictions[-1]['predicted']
        change_pct = ((final_pred - current_price) / current_price) * 100
        
        # Determine trend
        if change_pct > 1:
            trend = 'bullish'
        elif change_pct < -1:
            trend = 'bearish'
        else:
            trend = 'neutral'
        
        # Confidence based on trend alignment and volatility
        confidence = 70
        if indicators['trend_short'] == indicators['trend_long']:
            confidence += 10  # Aligned trend = higher confidence
        if volatility < 0.02:
            confidence += 5  # Low volatility = more predictable
        confidence = min(85, max(55, confidence))
        
        return {
            'predictions': predictions,
            'predictedChange': round(change_pct, 2),
            'confidence': confidence,
            'trend': trend,
            'source': 'momentum_trend',
            'indicators': {
                'rsi': round(indicators['rsi'], 1),
                'momentum_5d': round(indicators['ret_5d'], 2),
                'trend': 'up' if indicators['trend_short'] == 1 else 'down',
                'volatility': round(volatility * 100, 2)
            }
        }
    
    def _simple_prediction(self, prices: List[float], forecast_days: int) -> Dict:
        """Fallback for limited data"""
        if len(prices) < 2:
            return None
            
        current_price = prices[-1]
        
        # Use recent momentum
        if len(prices) >= 5:
            momentum = (prices[-1] - prices[-5]) / prices[-5]
        else:
            momentum = (prices[-1] - prices[0]) / prices[0]
        
        daily_momentum = momentum / min(5, len(prices))
        volatility = 0.015  # Assume 1.5% daily volatility
        
        predictions = []
        pred_price = current_price
        
        for day in range(1, forecast_days + 1):
            drift = daily_momentum * (1 - day * 0.05)  # Decay
            noise = np.random.randn() * volatility * 0.2
            daily_change = np.clip(drift + noise, -0.02, 0.02)
            pred_price = pred_price * (1 + daily_change)
            
            uncertainty = volatility * np.sqrt(day) * current_price
            
            predictions.append({
                'day': day,
                'predicted': round(pred_price, 2),
                'low': round(pred_price - uncertainty, 2),
                'high': round(pred_price + uncertainty, 2)
            })
        
        final_pred = predictions[-1]['predicted']
        change_pct = ((final_pred - current_price) / current_price) * 100
        
        return {
            'predictions': predictions,
            'predictedChange': round(change_pct, 2),
            'confidence': 60,
            'trend': 'bullish' if change_pct > 0.5 else ('bearish' if change_pct < -0.5 else 'neutral'),
            'source': 'momentum_simple'
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
