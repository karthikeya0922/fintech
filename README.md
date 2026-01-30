# ⚡ Data Dynomo (Finova)

> **The Next-Generation AI-Powered Financial Operating System**

Data Dynomo is a futuristic, high-performance financial dashboard merging personal finance management with enterprise-grade security and AI insights. Built with a unified "Glassmorphic Dark" aesthetic, real-time ML-powered fraud detection, and comprehensive financial analytics.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js) ![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python) ![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask) ![XGBoost](https://img.shields.io/badge/XGBoost-ML-orange)

---

## 🚀 Key Features

### 1. 🛡️ Enterprise Fraud Operations Platform (EFOP)

A Bloomberg Terminal-inspired interface for investigating and neutralizing financial threats in real-time.

- **Investigation Blade**: Deep-dive panel for selected fraud alerts with:
  - **Entity Network Graph**: Radial visualization of User ↔ Device ↔ IP ↔ Card relationships
  - **Velocity Matrix**: Hourly/Daily/Weekly transaction velocity sparklines
  - **Geo Intelligence**: Location-based threat analysis
- **Defense Engine**: Hybrid ML + Rule-based fraud detection:
  - **XGBoost Classifier**: Trained on 500K synthetic Indian transactions
  - **95% Recall**: High-accuracy fraud detection (ROC-AUC 0.94+)
  - **SHAP Explainability**: Real-time transparency on *why* a transaction was blocked
- **Smart Rules**: Velocity Breaker, Night Fraud Guard, Geo-Hopping Shield

### 2. 🤖 AI Financial Architect

A dedicated workspace for deep financial planning and market intelligence.

- **Full-Page Chat Interface**: Powered by Groq (Llama 3 70B) & Google Gemini
- **Context-Aware**: Understands your portfolio, spending habits, and risk profile
- **Live Market Data**: Real-time stock queries (e.g., "How is HDFC performing?") with live pricing via yfinance
- **Personalized Advice**: "How can I save ₹10L in 3 years?" based on your actual income/expenses

### 3. 📈 Smart Market Dashboard

Premium command center for market analysis and portfolio tracking.

- **Live Tickers**: Real-time scrolling ticker with NIFTY/SENSEX integration
- **ML Price Prediction**: 7-Day Stock Forecasts using technical indicators (RSI, MACD, SMA)
- **Interactive Charts**: Visual history of stock performance
- **Sentiment Analysis**: AI-driven market sentiment tracking

### 4. 📊 Intelligent Analytics

- **Net Worth Ring**: Visual breakdown of assets vs liabilities
- **Spending Heatmap**: Track high-spend days and categories
- **Subscription Manager**: Identify and cancel recurring drains on your wallet

---

## 🛠️ Technology Stack

### Frontend (`/src`)

| Technology        | Purpose                            |
| ----------------- | ---------------------------------- |
| **React**         | UI Framework with Vite bundler     |
| **TypeScript**    | Type-safe development              |
| **Framer Motion** | Fluid animations and transitions   |
| **Recharts**      | Charts and data visualization      |
| **Tailwind CSS**  | Utility-first styling              |
| **Glassmorphism** | Custom premium design system       |

### Backend (`/backend`)

| Technology         | Purpose                     |
| ------------------ | --------------------------- |
| **Flask**          | REST API server             |
| **Python 3.11**    | Core logic & ML orchestration|
| **XGBoost**        | Fraud detection classifier  |
| **SHAP**           | Model explainability        |
| **Pandas/NumPy**   | Data processing             |
| **Groq/Gemini**    | LLM Integration             |

---

## ⚡ Quick Start

### Prerequisites

- Node.js v18+
- Python 3.11+

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/data-dynomo.git
cd data-dynomo

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Create `backend/.env`:

```env
GROQ_API_KEY="your-groq-key"
GEMINI_API_KEY="your-gemini-key"
OPENAI_API_KEY="optional-fallback"
```

### 3. Start Services

**Terminal 1: Frontend (Port 5173)**
```bash
npm run dev
```

**Terminal 2: Backend API (Port 5000)**
```bash
cd backend
python app.py
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:5000

---

## 🧠 ML Model Details

### Fraud Detection (XGBoost)

**Training Data**: 500,000 synthetic Indian banking transactions

**Performance Metrics**:
| Metric | Value |
|--------|-------|
| ROC-AUC | 0.9439 |
| Recall | 95.01% |

**Top Features**:
1. `is_new_device` - Strongest fraud indicator
2. `distance_from_home` - Geo-velocity anomalies
3. `time_since_last_tx` - Velocity abuse detection

---

## 🎨 Design System

- **Theme**: Dark mode with "Cyber Blue" accents
- **Aesthetic**: Glassmorphism with deep blurs
- **Typography**: Inter (System)
- **Animations**: Spring physics via Framer Motion

---

## 📄 License

MIT License - Built with ❤️ by the Data Dynomo Team
