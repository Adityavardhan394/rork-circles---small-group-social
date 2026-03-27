import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { Conversation, Message, User } from '@/types';

const CONVERSATIONS_KEY = 'huddle_conversations';

export const [MessagesProvider, useMessages] = createContextHook(() => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const localQuery = useQuery({
    queryKey: ['localConversations'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CONVERSATIONS_KEY);
      return stored ? JSON.parse(stored) as Conversation[] : [];
    },
  });

  useEffect(() => {
    if (localQuery.data && !dataLoaded) {
      setConversations(localQuery.data);
      setDataLoaded(true);
      console.log('[MessagesProvider] Loaded conversations:', localQuery.data.length);
    }
  }, [localQuery.data, dataLoaded]);

  const persistLocal = useCallback((convs: Conversation[]) => {
    AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
  }, []);

  const getOrCreateDM = useCallback((currentUser: User, otherUser: User): Conversation => {
    const existing = conversations.find(
      c => c.type === 'dm' &&
        c.participants.some(p => p.id === currentUser.id) &&
        c.participants.some(p => p.id === otherUser.id)
    );
    if (existing) return existing;

    const newConv: Conversation = {
      id: `dm-${currentUser.id}-${otherUser.id}`,
      type: 'dm',
      participants: [currentUser, otherUser],
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setConversations(prev => {
      const updated = [newConv, ...prev];
      persistLocal(updated);
      return updated;
    });
    return newConv;
  }, [conversations, persistLocal]);

  const getOrCreateGroupChat = useCallback((circleId: string, circleName: string, circleEmoji: string, members: User[]): Conversation => {
    const existing = conversations.find(c => c.type === 'group' && c.circleId === circleId);
    if (existing) return existing;

    const newConv: Conversation = {
      id: `group-${circleId}`,
      type: 'group',
      circleId,
      circleName,
      circleEmoji,
      participants: members,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setConversations(prev => {
      const updated = [newConv, ...prev];
      persistLocal(updated);
      return updated;
    });
    return newConv;
  }, [conversations, persistLocal]);

  const sendMessage = useCallback((conversationId: string, message: Message) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== conversationId) return c;
        const newMessages = [...c.messages, message];
        return { ...c, messages: newMessages, lastMessage: message };
      });
      persistLocal(updated);
      return updated;
    });
    console.log('[MessagesProvider] Message sent in:', conversationId);
  }, [persistLocal]);

  const getConversation = useCallback((id: string) => {
    return conversations.find(c => c.id === id);
  }, [conversations]);

  const dmConversations = useMemo(() => {
    return conversations
      .filter(c => c.type === 'dm')
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.createdAt;
        const bTime = b.lastMessage?.createdAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }, [conversations]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((count, c) => {
      return count + c.messages.filter(m => !m.read).length;
    }, 0);
  }, [conversations]);

  return {
    conversations,
    dmConversations,
    totalUnread,
    getOrCreateDM,
    getOrCreateGroupChat,
    sendMessage,
    getConversation,
  };
});
