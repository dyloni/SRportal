import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types';

interface ChatInterfaceProps {
    chatPartnerName: string;
    messages: ChatMessage[];
    currentUserId: number | 'admin';
    onSendMessage: (text: string) => void;
    onTyping?: () => void;
    isPartnerTyping?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    chatPartnerName,
    messages,
    currentUserId,
    onSendMessage,
    onTyping,
    isPartnerTyping = false
}) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isPartnerTyping]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input.trim());
        setInput('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (onTyping && e.target.value.length > 0) {
            onTyping();
        }
    };

    return (
        <>
            <div className="p-4 border-b border-brand-border bg-brand-surface">
                <h3 className="text-lg font-bold text-brand-text-primary">Chat with {chatPartnerName}</h3>
                {isPartnerTyping && (
                    <p className="text-sm text-green-600 italic animate-pulse">typing...</p>
                )}
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-brand-bg space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-2xl px-5 py-3 max-w-lg ${msg.senderId === currentUserId ? 'bg-brand-pink text-white' : 'bg-gray-200 text-brand-text-primary'}`}>
                            <p>{msg.text}</p>
                            <div className="flex items-center justify-end gap-2 mt-1">
                                <p className={`text-xs ${msg.senderId === currentUserId ? 'text-pink-200' : 'text-gray-500'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {msg.senderId === currentUserId && (
                                    <span className="text-xs">
                                        {msg.status === 'read' ? '✓✓' : '✓'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isPartnerTyping && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="rounded-2xl px-5 py-3 bg-gray-200">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleFormSubmit} className="p-4 border-t border-brand-border bg-brand-surface">
                <div className="flex items-center bg-gray-100 rounded-full">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
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