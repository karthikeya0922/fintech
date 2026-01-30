import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserProfileProvider } from './context/UserProfileContext'; // Import new Provider
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import FraudOperations from './pages/FraudOperations';
import CreditIntelligence from './pages/CreditIntelligence';
import Subscriptions from './pages/Subscriptions';
import Investments from './pages/Investments';
import Alerts from './pages/Alerts';
import Terminal from './pages/Terminal';
import NewsHub from './pages/NewsHub';
import AIChat from './pages/AIChat';
import Settings from './pages/Settings'; // Import Settings

function App() {
  return (
    <AuthProvider>
      <UserProfileProvider> {/* Wrap with Profile Provider */}
        <Router>
          <Routes>
            {/* Public Route */}
            <Route path="/auth" element={<Auth />} />

            {/* Protected Routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/fraud" element={<FraudOperations />} />
                    <Route path="/credit" element={<CreditIntelligence />} />
                    <Route path="/subscriptions" element={<Subscriptions />} />
                    <Route path="/portfolio" element={<Investments />} />
                    <Route path="/investments" element={<Investments />} />
                    <Route path="/alerts" element={<Alerts />} />
                    <Route path="/terminal" element={<Terminal />} />
                    <Route path="/news" element={<NewsHub />} />
                    <Route path="/chat" element={<AIChat />} />
                    <Route path="/settings" element={<Settings />} /> {/* New Route */}
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </UserProfileProvider>
    </AuthProvider>
  );
}

export default App;
