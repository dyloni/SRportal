import { supabase } from '../utils/supabase';
import { ChatMessage } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  updatedAt: string;
}

export class MessagingService {
  private typingChannel: RealtimeChannel | null = null;

  async sendMessage(message: ChatMessage): Promise<void> {
    const dbMessage = {
      id: message.id,
      sender_id: String(message.senderId),
      sender_name: message.senderName,
      recipient_id: String(message.recipientId),
      text: message.text,
      timestamp: message.timestamp,
      status: 'unread',
      is_delivered: true,
      is_read: false,
      delivered_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('messages')
      .insert(dbMessage);

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markAsRead(messageIds: number[], userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        status: 'read',
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .in('id', messageIds)
      .eq('recipient_id', String(userId));

    if (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async markConversationAsRead(senderId: string, recipientId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        status: 'read',
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('sender_id', String(senderId))
      .eq('recipient_id', String(recipientId))
      .eq('status', 'unread');

    if (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }

  async setTypingIndicator(userId: string, conversationId: string, isTyping: boolean): Promise<void> {
    const { error } = await supabase
      .from('typing_indicators')
      .upsert({
        user_id: String(userId),
        conversation_id: conversationId,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,conversation_id'
      });

    if (error) {
      console.error('Error setting typing indicator:', error);
    }
  }

  subscribeToTypingIndicators(
    conversationId: string,
    onTypingChange: (userId: string, isTyping: boolean) => void
  ): void {
    this.typingChannel = supabase
      .channel(`typing-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const data = payload.new as any;
          if (data) {
            onTypingChange(data.user_id, data.is_typing);
          }
        }
      )
      .subscribe();
  }

  unsubscribeFromTyping(): void {
    if (this.typingChannel) {
      supabase.removeChannel(this.typingChannel);
      this.typingChannel = null;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', String(userId))
      .eq('status', 'unread');

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  }

  async getConversations(userId: string): Promise<Array<{ partnerId: string; partnerName: string; lastMessage: string; unreadCount: number; timestamp: string }>> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error getting conversations:', error);
      return [];
    }

    const conversationMap = new Map<string, any>();

    messages?.forEach((msg: any) => {
      const partnerId = msg.sender_id === String(userId) ? msg.recipient_id : msg.sender_id;
      const partnerName = msg.sender_id === String(userId) ? 'Unknown' : msg.sender_name;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: msg.text,
          timestamp: msg.timestamp,
          unreadCount: 0,
        });
      }

      if (msg.recipient_id === String(userId) && msg.status === 'unread') {
        const conv = conversationMap.get(partnerId);
        if (conv) {
          conv.unreadCount++;
        }
      }
    });

    return Array.from(conversationMap.values());
  }
}

export const messagingService = new MessagingService();
