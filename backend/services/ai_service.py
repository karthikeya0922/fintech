"""
Visnova 2.0 Backend - AI Chat Service
Context-aware financial assistant using Google Gemini (Free)
"""
import os
import re
import random
from typing import Dict, List, Any, Optional
from config import Config
from services.stock_service import INDIAN_STOCKS, get_stock_price

# Try to import Groq
try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False

# Try to import Google Generative AI
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

# Try to import OpenAI as fallback
try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


class AIAssistant:
    def __init__(self):
        self.gemini_model = None
        self.openai_client = None
        self.groq_client = None

        # Initialize Groq (Fastest!)
        groq_key = os.getenv('GROQ_API_KEY', Config.GROQ_API_KEY if hasattr(Config, 'GROQ_API_KEY') else None)
        if HAS_GROQ and groq_key:
            try:
                self.groq_client = Groq(api_key=groq_key)
                print("✅ Groq AI initialized")
            except Exception as e:
                print(f"Groq init error: {e}")
        
        # Initialize Gemini (Free!)
        gemini_key = os.getenv('GEMINI_API_KEY', Config.GEMINI_API_KEY if hasattr(Config, 'GEMINI_API_KEY') else None)
        if HAS_GEMINI and gemini_key:
            try:
                genai.configure(api_key=gemini_key)
                self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
                print("✅ Gemini AI initialized")
            except Exception as e:
                print(f"Gemini init error: {e}")
        
        # Fallback to OpenAI
        if HAS_OPENAI and Config.OPENAI_API_KEY:
            self.openai_client = OpenAI(api_key=Config.OPENAI_API_KEY)
        
        self.system_prompt = """You are Finova AI, a smart financial assistant for Finova - a premium fintech app.

PERSONALITY:
- Friendly but professional
- Concise and actionable
- Use Indian Rupee (₹) for currency
- Reference the user's actual data when available

CAPABILITIES:
- Analyze user's financial health based on their profile
- Provide personalized savings/investment advice
- Explain financial concepts clearly
- Help with budget planning and goal setting
- Answer questions about stocks, mutual funds, and markets

IMPORTANT: Always use the user's profile data to personalize responses. Reference their income, expenses, savings rate, and goals."""

    def get_context_prompt(self, page: str, user_data: Optional[Dict] = None) -> str:
        """Generate context-specific prompt based on current page and user profile"""
        context = f"The user is on the {page} page.\n\n"
        
        if user_data:
            # Calculate key metrics
            income = user_data.get('income', 85000)
            expenses = user_data.get('expenses', 45000)
            savings = income - expenses
            savings_rate = round((savings / income) * 100, 1) if income > 0 else 0
            
            context += f"""USER PROFILE:
- Name: {user_data.get('name', 'User')}
- Monthly Income: ₹{income:,}
- Monthly Expenses: ₹{expenses:,}
- Monthly Savings: ₹{savings:,} ({savings_rate}% savings rate)
- Portfolio Value: ₹{user_data.get('portfolioValue', 245000):,}
- Credit Score: {user_data.get('creditScore', 742)}
- Risk Profile: {user_data.get('riskProfile', 'Moderate')}
"""
        
        page_contexts = {
            'dashboard': "Analyze overall financial health and provide actionable tips.",
            'investments': "Help with stock analysis and investment strategies.",
            'terminal': "Assist with financial calculations. You can suggest values for SIP, EMI, rates.",
            'news': "Summarize news impact and explain market movements.",
            'portfolio': "Analyze portfolio and suggest optimization."
        }
        
        context += f"\nFOCUS: {page_contexts.get(page.lower(), 'Provide helpful financial guidance.')}"
        
        return context

    def chat(
        self, 
        message: str, 
        page: str = 'dashboard',
        user_data: Optional[Dict] = None,
        history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Process a chat message and return AI response"""
        
        context = self.get_context_prompt(page, user_data)
        
        # Check for command patterns first
        command = self._parse_command(message)
        if command:
            return {
                'response': f"I'll help you with that! {command['description']}",
                'command': command,
                'isCommand': True
            }
        
        # Try Groq first (Fastest!)
        if self.groq_client:
            try:
                messages = [
                    {"role": "system", "content": self.system_prompt + "\n\n" + context}
                ]
                
                if history:
                    for msg in history[-5:]:
                        messages.append({
                            "role": msg.get('role', 'user'),
                            "content": msg.get('content', '')
                        })
                
                messages.append({"role": "user", "content": message})
                
                completion = self.groq_client.chat.completions.create(
                    model="llama-3.1-70b-versatile",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=500
                )
                
                return {
                    'response': completion.choices[0].message.content,
                    'isCommand': False,
                    'model': 'groq-llama3'
                }
            except Exception as e:
                print(f"Groq error: {e}")
        
        # Try Gemini first (Free!)
        if self.gemini_model:
            try:
                full_prompt = f"{self.system_prompt}\n\n{context}\n\nUser: {message}\n\nAssistant:"
                
                response = self.gemini_model.generate_content(full_prompt)
                
                return {
                    'response': response.text,
                    'isCommand': False,
                    'model': 'gemini'
                }
            except Exception as e:
                print(f"Gemini error: {e}")
        
        # Try OpenAI as fallback
        if self.openai_client:
            try:
                messages = [
                    {"role": "system", "content": self.system_prompt + "\n\n" + context}
                ]
                
                if history:
                    for msg in history[-5:]:
                        messages.append({
                            "role": msg.get('role', 'user'),
                            "content": msg.get('content', '')
                        })
                
                messages.append({"role": "user", "content": message})
                
                response = self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    max_tokens=500,
                    temperature=0.7
                )
                
                return {
                    'response': response.choices[0].message.content,
                    'isCommand': False,
                    'model': 'openai'
                }
            except Exception as e:
                print(f"OpenAI error: {e}")
        
        # Smart fallback using user profile
        return self._smart_fallback(message, page, user_data)

    def _parse_command(self, message: str) -> Optional[Dict]:
        """Parse message for actionable commands"""
        message_lower = message.lower()
        
        # Set variable patterns
        if 'set' in message_lower and 'monthly' in message_lower:
            match = re.search(r'(\d+)', message)
            if match:
                value = int(match.group(1))
                return {
                    'action': 'set_variable',
                    'variable': 'monthly_invest',
                    'value': value,
                    'description': f'Setting monthly investment to ₹{value:,}'
                }
        
        if 'change rate' in message_lower or 'set rate' in message_lower:
            match = re.search(r'(\d+(?:\.\d+)?)', message)
            if match:
                value = float(match.group(1))
                return {
                    'action': 'set_variable',
                    'variable': 'rate',
                    'value': value,
                    'description': f'Changing rate to {value}%'
                }
        
        if 'run' in message_lower and ('model' in message_lower or 'calculate' in message_lower):
            return {
                'action': 'run_model',
                'description': 'Running the calculation...'
            }
        
        return None

    def _smart_fallback(self, message: str, page: str, user_data: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate intelligent fallback response using user profile data"""
        
        # Default profile values
        income = 85000
        expenses = 45000
        portfolio = 245000
        credit_score = 742
        name = "there"
        
        if user_data:
            income = user_data.get('income', income)
            expenses = user_data.get('expenses', expenses)
            portfolio = user_data.get('portfolioValue', portfolio)
            credit_score = user_data.get('creditScore', credit_score)
            name = user_data.get('name', name).split()[0]  # First name
        
        savings = income - expenses
        savings_rate = round((savings / income) * 100, 1) if income > 0 else 0
        message_lower = message.lower()
        
        # Smart response based on question type
        
        # Stock Recommendations (Dynamic)
        if any(word in message_lower for word in ['company', 'companies', 'stock', 'share', 'recommend', 'buy', 'invest in']):
            # Pick 2 random stocks
            stocks = list(INDIAN_STOCKS.keys())
            random.shuffle(stocks)
            selected = stocks[:2]
            
            # FAST - Parallel Fetch
            from services.stock_service import get_batch_stock_prices
            batch_data = get_batch_stock_prices(selected)
            
            details = []
            for sym in selected:
                data = batch_data.get(sym)
                if data:
                    price = data.get('price', 0)
                    change = data.get('changePercent', 0)
                    trend = "📈" if change >= 0 else "📉"
                    details.append(f"{data['name']} (₹{price:,} {trend} {change}%)")
            
            if details:
                response = f"Current market trends suggest looking at blue-chip stocks. Right now:\n\n• {details[0]}\n• {details[1]}\n\nGiven your risk profile, these could be good additions for long-term growth. Always do your own research!"
            else:
                 response = f"I recommend looking at blue-chip stocks like Reliance and TCS. However, I'm having trouble fetching live prices right now. Please check the Market Dashboard."

        elif any(word in message_lower for word in ['saving', 'save', 'savings']):
            if savings_rate >= 30:
                response = f"Great news, {name}! You're saving ₹{savings:,} monthly - that's a {savings_rate}% savings rate, which is excellent! 🎉 Consider investing more in equity mutual funds for long-term growth."
            elif savings_rate >= 20:
                response = f"You're saving ₹{savings:,} monthly ({savings_rate}% savings rate). That's decent, {name}! To boost this to 30%, try cutting discretionary expenses by ₹{int((income * 0.3) - savings):,}."
            else:
                response = f"You're currently saving ₹{savings:,} monthly ({savings_rate}%). Let's work on improving this, {name}. I'd recommend starting with a budget audit to find areas to cut back."
        
        elif any(word in message_lower for word in ['income', 'earn', 'salary']):
            response = f"Your monthly income is ₹{income:,}, {name}. After expenses of ₹{expenses:,}, you have ₹{savings:,} for savings and investments."
        
        elif any(word in message_lower for word in ['expense', 'spend', 'spending']):
            expense_ratio = round((expenses / income) * 100, 1)
            response = f"Your monthly expenses are ₹{expenses:,} ({expense_ratio}% of income). "
            if expense_ratio > 70:
                response += "This is quite high - consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings."
            else:
                response += "You're managing expenses well! Keep tracking to maintain this."
        
        elif any(word in message_lower for word in ['portfolio', 'invest', 'investment']) and 'what' not in message_lower:
            response = f"Your current portfolio value is ₹{portfolio:,}. "
            if portfolio > 500000:
                response += "Great progress! Consider diversifying across equity, debt, and gold."
            else:
                response += f"With monthly savings of ₹{savings:,}, you can grow this significantly through SIP."
        
        elif any(word in message_lower for word in ['credit', 'score', 'cibil']):
            if credit_score >= 750:
                response = f"Your credit score is {credit_score} - Excellent! 🌟 You'll get the best loan rates."
            elif credit_score >= 700:
                response = f"Your credit score is {credit_score} - Good. Pay bills on time to push it above 750."
            else:
                response = f"Your credit score is {credit_score}. Focus on timely payments and reducing credit utilization."
        
        elif any(word in message_lower for word in ['sip', 'mutual fund']):
            monthly_sip = max(10000, savings // 2)
            response = f"Based on your savings of ₹{savings:,}/month, I recommend starting a SIP of ₹{monthly_sip:,}. A 12% annual return over 10 years could grow to ₹{int(monthly_sip * 233):,}!"
        
        elif any(word in message_lower for word in ['help', 'can you', 'what can']):
            response = f"Hi {name}! I can help you with:\n• Analyzing your ₹{savings:,} monthly savings\n• Investment recommendations for your ₹{portfolio:,} portfolio\n• SIP/EMI calculations\n• Credit score insights ({credit_score})\n\nWhat would you like to explore?"
        
        elif 'hi' in message_lower or 'hello' in message_lower or 'hey' in message_lower:
            response = f"Hello {name}! 👋 I'm Finova AI, your financial assistant. You're saving ₹{savings:,}/month with a portfolio of ₹{portfolio:,}. How can I help you today?"
        
        else:
            # Generic but personalized
            responses = [
                f"Based on your profile, {name}, you're doing well with a {savings_rate}% savings rate. What specific aspect would you like to explore?",
                f"I see you have ₹{savings:,} in monthly savings, {name}. Would you like investment suggestions or help with a calculation?",
                f"Your financial health looks {('solid' if savings_rate >= 25 else 'good')}, {name}! Ask me about investments, savings goals, or use the Terminal for calculations.",
            ]
            response = random.choice(responses)
        
        return {
            'response': response,
            'isCommand': False,
            'model': 'smart-fallback'
        }

    def get_suggestions(self, page: str) -> List[str]:
        """Get context-aware suggestions for the current page"""
        suggestions = {
            'dashboard': [
                "How are my savings doing?",
                "Analyze my spending pattern",
                "What's my credit score?",
            ],
            'investments': [
                "Suggest stocks for my risk profile",
                "How's my portfolio performing?",
                "Best SIP for ₹10,000/month",
            ],
            'terminal': [
                "Set monthly investment to 25000",
                "Change rate to 12%",
                "Run the calculation",
            ],
            'news': [
                "Summarize today's market",
                "Impact on my portfolio?",
                "Explain RBI policy",
            ],
        }
        
        return suggestions.get(page.lower(), suggestions['dashboard'])


# Global instance
ai_assistant = AIAssistant()


def chat(message: str, page: str = 'dashboard', user_data: Dict = None, history: List = None):
    """Main chat function"""
    return ai_assistant.chat(message, page, user_data, history)


def get_suggestions(page: str):
    """Get suggestions for current page"""
    return ai_assistant.get_suggestions(page)
