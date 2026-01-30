import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Sparkles,
    Loader2,
    Bot,
    User,
    Trash2,
    Plus,
    MessageSquare,
    TrendingUp,
    Calculator,
    PiggyBank,
    CreditCard,
    Shield,
    Newspaper,
    Zap,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../context/UserProfileContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    messages: Message[];
}

const QUICK_PROMPTS = [
    { icon: TrendingUp, label: 'Stock Analysis', prompt: 'Analyze the current market trends for Indian stocks' },
    { icon: Calculator, label: 'SIP Calculator', prompt: 'Help me calculate SIP for ₹50,000 monthly at 12% returns' },
    { icon: PiggyBank, label: 'Savings Tips', prompt: 'Give me practical tips to improve my savings rate' },
    { icon: CreditCard, label: 'Credit Score', prompt: 'How can I improve my credit score?' },
    { icon: Shield, label: 'Fraud Prevention', prompt: 'What are the best practices to prevent financial fraud?' },
    { icon: Newspaper, label: 'Market News', prompt: 'Summarize today\'s important financial news' },
];

const AIChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const location = useLocation();
    const { user } = useAuth();
    const { profile } = useUserProfile();

    // Handle new chat from sidebar
    useEffect(() => {
        if (location.state?.newChat) {
            startNewChat();
            // Clear history state to prevent loop
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Load chat sessions from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('finova_chat_sessions');
        if (saved) {
            const sessions = JSON.parse(saved);
            setChatSessions(sessions.map((s: ChatSession) => ({
                ...s,
                timestamp: new Date(s.timestamp),
                messages: s.messages.map((m: Message) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }))
            })));
        }
    }, []);

    // Save sessions to localStorage
    useEffect(() => {
        if (chatSessions.length > 0) {
            localStorage.setItem('finova_chat_sessions', JSON.stringify(chatSessions));
        }
    }, [chatSessions]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const getCurrentPage = () => {
        const path = location.pathname;
        if (path === '/') return 'dashboard';
        return path.replace('/', '');
    };

    const startNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            lastMessage: '',
            timestamp: new Date(),
            messages: []
        };
        setChatSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        setMessages([]);
    };

    const selectSession = (session: ChatSession) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages);
    };

    const deleteSession = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setChatSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
            setMessages([]);
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

        // Create session if none exists
        let sessionId = currentSessionId;
        if (!sessionId) {
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: messageText.slice(0, 30) + (messageText.length > 30 ? '...' : ''),
                lastMessage: messageText,
                timestamp: new Date(),
                messages: [userMessage]
            };
            setChatSessions(prev => [newSession, ...prev]);
            sessionId = newSession.id;
            setCurrentSessionId(sessionId);
        }

        try {
            const userData = {
                name: profile.name || user?.name || 'User',
                email: profile.email || user?.email,
                income: profile.income,
                expenses: profile.expenses,
                savingsGoal: profile.savingsGoal,
                portfolioValue: profile.portfolioValue,
                theme: profile.theme
            };

            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    page: getCurrentPage(),
                    userData,
                    history: messages.slice(-10).map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            });

            if (response.ok) {
                const data = await response.json();
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date()
                };

                setMessages(prev => {
                    const newMessages = [...prev, assistantMessage];
                    // Update session
                    setChatSessions(sessions => sessions.map(s =>
                        s.id === sessionId
                            ? { ...s, messages: newMessages, lastMessage: data.response.slice(0, 50) }
                            : s
                    ));
                    return newMessages;
                });
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I apologize, but I'm having trouble connecting. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([]);
        if (currentSessionId) {
            setChatSessions(sessions => sessions.map(s =>
                s.id === currentSessionId
                    ? { ...s, messages: [], lastMessage: '' }
                    : s
            ));
        }
    };

    return (
        <div className="ai-chat-page">
            {/* Sidebar with chat history */}
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <button className="btn btn-primary" onClick={startNewChat} style={{ width: '100%' }}>
                        <Plus size={18} />
                        New Chat
                    </button>
                </div>
                <div className="chat-history">
                    {chatSessions.length === 0 ? (
                        <div className="chat-history-empty">
                            <MessageSquare size={32} color="var(--text-muted)" />
                            <p>No chat history</p>
                            <span>Start a new conversation</span>
                        </div>
                    ) : (
                        chatSessions.map(session => (
                            <div
                                key={session.id}
                                className={`chat-history-item ${currentSessionId === session.id ? 'active' : ''}`}
                                onClick={() => selectSession(session)}
                            >
                                <MessageSquare size={16} />
                                <div className="chat-history-content">
                                    <div className="chat-history-title">{session.title}</div>
                                    <div className="chat-history-preview">{session.lastMessage}</div>
                                </div>
                                <button
                                    className="chat-history-delete"
                                    onClick={(e) => deleteSession(session.id, e)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main chat area */}
            <div className="chat-main">
                {messages.length === 0 ? (
                    /* Welcome screen */
                    <div className="chat-welcome">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="chat-welcome-icon"
                        >
                            <Zap size={48} />
                        </motion.div>
                        <h1>Welcome to <span className="gradient-text">Finova AI</span></h1>
                        <p>Your intelligent financial assistant. Ask me anything about stocks, investments, savings, or financial planning.</p>

                        <div className="quick-prompts-grid">
                            {QUICK_PROMPTS.map((prompt, idx) => (
                                <motion.button
                                    key={idx}
                                    className="quick-prompt-card"
                                    onClick={() => handleSend(prompt.prompt)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <prompt.icon size={24} color="var(--accent-cyan)" />
                                    <span>{prompt.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Chat messages */
                    <div className="chat-messages">
                        <AnimatePresence>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    className={`chat-message ${message.role}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="message-avatar">
                                        {message.role === 'assistant' ? (
                                            <Bot size={20} />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div className="message-content">
                                        <div className="message-header">
                                            <span className="message-sender">
                                                {message.role === 'assistant' ? 'Finova AI' : 'You'}
                                            </span>
                                            <span className="message-time">
                                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="message-text">
                                            {message.content.split('\n').map((line, i) => (
                                                <p key={i}>{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <motion.div
                                className="chat-message assistant"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="message-avatar">
                                    <Bot size={20} />
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
                )}

                {/* Input area */}
                <div className="chat-input-container">
                    {messages.length > 0 && (
                        <button className="clear-chat-btn" onClick={clearChat}>
                            <Trash2 size={16} />
                            Clear chat
                        </button>
                    )}
                    <div className="chat-input-wrapper">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask Finova AI anything about your finances..."
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            className="send-btn"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="spin" />
                            ) : (
                                <Send size={20} />
                            )}
                        </button>
                    </div>
                    <div className="chat-input-hint">
                        <Sparkles size={12} />
                        Powered by Gemini AI • Press Enter to send
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChat;
