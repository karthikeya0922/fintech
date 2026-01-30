import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Send,
    Sparkles,
    Loader2,
    Bot,
    User,
    Trash2,
    Lightbulb,
    TrendingUp,
    Calculator,
    PiggyBank,
    CreditCard
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatCommand {
    action: string;
    variable?: string;
    value?: unknown;
    description: string;
}

const QUICK_ACTIONS = [
    { icon: TrendingUp, label: 'Stock Analysis', prompt: 'Analyze my stock portfolio performance' },
    { icon: Calculator, label: 'SIP Calculator', prompt: 'Help me calculate SIP for 50000 monthly at 12%' },
    { icon: PiggyBank, label: 'Savings Tips', prompt: 'Give me tips to improve my savings rate' },
    { icon: CreditCard, label: 'Credit Score', prompt: 'How can I improve my credit score?' },
];

const AIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();
    const { user } = useAuth();

    const getCurrentPage = () => {
        const path = location.pathname;
        if (path === '/') return 'dashboard';
        return path.replace('/', '');
    };

    useEffect(() => {
        if (isOpen) {
            fetchSuggestions();
            inputRef.current?.focus();
        }
    }, [isOpen, location.pathname]);

    const fetchSuggestions = async () => {
        const page = getCurrentPage();
        try {
            const response = await fetch(`http://localhost:5000/api/chat/suggestions?page=${page}`);
            if (response.ok) {
                const data = await response.json();
                setSuggestions(data.suggestions || []);
            }
        } catch {
            setSuggestions([
                "What's my financial health?",
                "Analyze my spending patterns",
                "Suggest investment strategies",
            ]);
        }
    };

    const handleSend = async (customMessage?: string) => {
        const messageText = customMessage || input.trim();
        if (!messageText || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setInput('');
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const userData = user ? {
                name: user.name,
                email: user.email,
                income: 85000,
                expenses: 45000,
                portfolioValue: 245000,
                creditScore: 742,
                riskProfile: 'Moderate'
            } : null;

            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    page: getCurrentPage(),
                    userData,
                    history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);

                if (data.isCommand && data.command) {
                    handleCommand(data.command);
                }
            } else {
                throw new Error('Failed');
            }
        } catch {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting. Please make sure the backend is running on port 5000.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCommand = (command: ChatCommand) => {
        window.dispatchEvent(new CustomEvent('ai-command', { detail: command }));
    };

    const handleQuickAction = (prompt: string) => {
        handleSend(prompt);
    };

    const clearChat = () => {
        setMessages([]);
    };

    const formatMessage = (content: string) => {
        // Simple markdown-like formatting
        return content
            .split('\n')
            .map((line, i) => {
                // Bold text
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Bullet points
                if (line.startsWith('• ') || line.startsWith('- ')) {
                    return `<li key=${i}>${line.slice(2)}</li>`;
                }
                // Numbered lists
                if (/^\d+\.\s/.test(line)) {
                    return `<li key=${i}>${line.replace(/^\d+\.\s/, '')}</li>`;
                }
                return line ? `<p key=${i}>${line}</p>` : '<br/>';
            })
            .join('');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                className="ai-fab"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isOpen ? 180 : 0 }}
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} />}
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="ai-chat-panel"
                        initial={{ opacity: 0, x: 400, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 400, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="ai-chat-header">
                            <div className="ai-chat-title">
                                <div className="ai-avatar">
                                    <Bot size={20} />
                                </div>
                                <div className="ai-title-text">
                                    <span className="ai-name">Void AI</span>
                                    <span className="ai-status">
                                        <span className="status-dot"></span>
                                        Online
                                    </span>
                                </div>
                            </div>
                            <div className="ai-header-actions">
                                <button onClick={clearChat} title="Clear chat">
                                    <Trash2 size={16} />
                                </button>
                                <button onClick={() => setIsOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="ai-chat-messages">
                            {messages.length === 0 ? (
                                <div className="ai-welcome-screen">
                                    <div className="ai-welcome-icon">
                                        <Sparkles size={32} />
                                    </div>
                                    <h3>Hi{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋</h3>
                                    <p>I'm your AI financial assistant. Ask me anything about your finances, investments, or use quick actions below.</p>

                                    {/* Quick Actions */}
                                    <div className="ai-quick-actions">
                                        {QUICK_ACTIONS.map((action, i) => (
                                            <button
                                                key={i}
                                                className="quick-action-btn"
                                                onClick={() => handleQuickAction(action.prompt)}
                                            >
                                                <action.icon size={16} />
                                                <span>{action.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Suggestions */}
                                    {suggestions.length > 0 && (
                                        <div className="ai-suggestions">
                                            <div className="suggestions-header">
                                                <Lightbulb size={14} />
                                                <span>Try asking</span>
                                            </div>
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    className="suggestion-chip"
                                                    onClick={() => handleSend(s)}
                                                >
                                                    "{s}"
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            className={`ai-message-bubble ${msg.role}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="message-avatar">
                                                {msg.role === 'user' ? (
                                                    <User size={16} />
                                                ) : (
                                                    <Bot size={16} />
                                                )}
                                            </div>
                                            <div className="message-content">
                                                <div
                                                    className="message-text"
                                                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                                                />
                                                <span className="message-time">
                                                    {msg.timestamp.toLocaleTimeString('en-IN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </>
                            )}

                            {/* Typing Indicator */}
                            {isLoading && (
                                <motion.div
                                    className="ai-message-bubble assistant"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="message-avatar">
                                        <Bot size={16} />
                                    </div>
                                    <div className="message-content">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="ai-chat-input">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Ask me anything..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="send-btn"
                            >
                                {isLoading ? (
                                    <Loader2 size={18} className="spin" />
                                ) : (
                                    <Send size={18} />
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistant;
