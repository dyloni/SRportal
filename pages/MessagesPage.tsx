import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { ChatMessage, Agent, Admin } from '../types';
import Card from '../components/ui/Card';
import ChatInterface from '../components/chat/ChatInterface';

type ChatPartner = Pick<Agent, 'id' | 'firstName' | 'surname'> | { id: 'admin', firstName: string, surname: string };

const MessagesPage: React.FC = () => {
    const { user } = useAuth();
    const { state, dispatch, dispatchWithOffline } = useData();
    const location = useLocation();

    const [activeChatPartnerId, setActiveChatPartnerId] = useState<number | 'admin' | null>(null);

    const currentUserId = user?.type === 'agent' ? user.id : 'admin';
    
    useEffect(() => {
        if (user?.type === 'agent') {
            setActiveChatPartnerId('admin');
        } else if (location.state?.agentId) {
            setActiveChatPartnerId(location.state.agentId);
        }
    }, [user, location.state]);

    useEffect(() => {
        if (activeChatPartnerId && currentUserId) {
            const hasUnread = state.messages.some(m => m.senderId === activeChatPartnerId && m.recipientId === currentUserId && m.status === 'unread');
            if (hasUnread) {
                // Use the main dispatch which will sync the read status across tabs
                dispatch({ type: 'MARK_MESSAGES_AS_READ', payload: { chatPartnerId: activeChatPartnerId, currentUserId } });
            }
        }
    }, [activeChatPartnerId, currentUserId, state.messages, dispatch]);

    const handleSendMessage = (text: string) => {
        if (!user || !activeChatPartnerId) return;

        const newMessage: ChatMessage = {
            id: Date.now() + Math.random(),
            senderId: currentUserId,
            senderName: `${user.firstName} ${user.surname}`,
            recipientId: activeChatPartnerId,
            text: text,
            timestamp: new Date().toISOString(),
            status: 'unread',
        };

        // This will now automatically broadcast to other tabs
        dispatchWithOffline({ type: 'SEND_MESSAGE', payload: newMessage });
    };

    const getConversationList = (): ChatPartner[] => {
        if (user?.type === 'agent') {
            return [{ id: 'admin', firstName: 'Admin', surname: '' }];
        }
        return state.agents;
    };

    const conversationList = getConversationList();
    
    const activeConversationMessages = useMemo(() => {
        if (!activeChatPartnerId || !currentUserId) return [];
        return state.messages.filter(m =>
            (m.senderId === currentUserId && m.recipientId === activeChatPartnerId) ||
            (m.senderId === activeChatPartnerId && m.recipientId === currentUserId) ||
            (m.recipientId === 'broadcast' && user?.type === 'agent') // Agents see broadcasts
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [state.messages, currentUserId, activeChatPartnerId, user]);
    
    const activeChatPartner = conversationList.find(p => p.id === activeChatPartnerId);
    const activeChatPartnerName = activeChatPartner ? `${activeChatPartner.firstName} ${activeChatPartner.surname}`.trim() : 'Select a conversation';

    return (
        <div>
            <h2 className="text-3xl font-extrabold text-brand-text-primary mb-6">Messages</h2>
            <Card className="p-0 sm:p-0">
                <div className="flex h-[75vh] rounded-xl overflow-hidden">
                    <div className="w-full md:w-1/3 border-r border-brand-border bg-brand-surface overflow-y-auto">
                        {conversationList.map(partner => {
                            const partnerName = `${partner.firstName} ${partner.surname}`.trim();
                            const lastMessage = [...state.messages]
                                .filter(m => (m.senderId === partner.id && m.recipientId === currentUserId) || (m.senderId === currentUserId && m.recipientId === partner.id))
                                .pop();
                            const unreadCount = state.messages.filter(m => m.senderId === partner.id && m.recipientId === currentUserId && m.status === 'unread').length;
                            
                            return (
                                <div
                                    key={partner.id}
                                    onClick={() => setActiveChatPartnerId(partner.id)}
                                    className={`p-4 cursor-pointer border-l-4 ${activeChatPartnerId === partner.id ? 'bg-brand-pink/10 border-brand-pink' : 'border-transparent hover:bg-gray-100'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-lg">{partnerName}</p>
                                        {unreadCount > 0 && <span className="text-xs font-bold bg-red-500 text-white rounded-full px-2 py-1">{unreadCount}</span>}
                                    </div>
                                    <p className="text-sm text-brand-text-secondary truncate">{lastMessage?.text || 'No messages yet'}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-full md:w-2/3 flex-col hidden md:flex">
                        {activeChatPartner ? (
                           <ChatInterface
                                chatPartnerName={activeChatPartnerName}
                                messages={activeConversationMessages}
                                currentUserId={currentUserId}
                                onSendMessage={handleSendMessage}
                           />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-brand-text-secondary">
                                <p>Select a conversation to start messaging.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MessagesPage;