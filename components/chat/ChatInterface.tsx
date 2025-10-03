import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types';

interface ChatInterfaceProps {
    chatPartnerName: string;
    messages: ChatMessage[];
    currentUserId: number | 'admin';
    onSendMessage: (text: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatPartnerName, messages, currentUserId, onSendMessage }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input.trim());
        setInput('');
    };

    return (
        <>
            <div className="p-4 border-b border-brand-border bg-brand-surface">
                <h3 className="text-lg font-bold text-brand-text-primary">Chat with {chatPartnerName}</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-brand-bg space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-2xl px-5 py-3 max-w-lg ${msg.senderId === currentUserId ? 'bg-brand-pink text-white' : 'bg-gray-200 text-brand-text-primary'}`}>
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 text-right ${msg.senderId === currentUserId ? 'text-pink-200' : 'text-gray-500'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleFormSubmit} className="p-4 border-t border-brand-border bg-brand-surface">
                <div className="flex items-center bg-gray-100 rounded-full">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent p-4 focus:outline-none text-base text-brand-text-primary"
                    />
                    <button type="submit" className="p-3 text-brand-pink hover:text-brand-light-pink disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={!input.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                </div>
            </form>
        </>
    );
};

export default ChatInterface;