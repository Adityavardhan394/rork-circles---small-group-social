import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMessages } from '@/providers/MessagesProvider';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';
import { Message } from '@/types';

function getTimeDisplay(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours();
  const mins = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

export default function ChatScreen() {
  const { userId, circleId } = useLocalSearchParams<{ userId?: string; circleId?: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { getOrCreateDM, getOrCreateGroupChat, sendMessage, conversations } = useMessages();
  const { circles } = useCircles();
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const conversationData = useMemo(() => {
    if (circleId) {
      const circle = circles.find(c => c.id === circleId);
      if (!circle || !user) return null;
      const conv = getOrCreateGroupChat(circle.id, circle.name, circle.emoji, circle.members);
      return { conv, title: circle.name, subtitle: `${circle.members.length} members`, avatar: null, emoji: circle.emoji, color: circle.color };
    }
    if (userId) {
      const otherUser = circles.flatMap(c => c.members).find(m => m.id === userId);
      if (!otherUser || !user) return null;
      const conv = getOrCreateDM(user, otherUser);
      return { conv, title: otherUser.name, subtitle: 'Direct message', avatar: otherUser.avatar, emoji: null, color: null };
    }
    return null;
  }, [circleId, userId, circles, user, getOrCreateDM, getOrCreateGroupChat]);

  const currentConv = useMemo(() => {
    if (!conversationData) return null;
    return conversations.find(c => c.id === conversationData.conv.id) ?? conversationData.conv;
  }, [conversations, conversationData]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, [currentConv?.messages.length]);

  const handleSend = useCallback(() => {
    if (!text.trim() || !currentConv || !user) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: true,
    };
    sendMessage(currentConv.id, msg);
    setText('');
  }, [text, currentConv, user, sendMessage]);

  if (!conversationData || !currentConv) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.emptyCenter}>
            <Text style={styles.emptyText}>Conversation not found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            {conversationData.avatar ? (
              <Image source={{ uri: conversationData.avatar }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerGroupAvatar, { backgroundColor: (conversationData.color ?? Colors.primary) + '20' }]}>
                <Text style={styles.headerEmoji}>{conversationData.emoji}</Text>
              </View>
            )}
            <View>
              <Text style={styles.headerName}>{conversationData.title}</Text>
              <Text style={styles.headerSubtitle}>{conversationData.subtitle}</Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {currentConv.messages.length === 0 && (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatEmoji}>👋</Text>
                <Text style={styles.emptyChatText}>
                  Say hello to start the conversation!
                </Text>
              </View>
            )}
            {currentConv.messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <View key={msg.id} style={[styles.messageBubbleRow, isMe && styles.messageBubbleRowMe]}>
                  {!isMe && circleId && (
                    <Image source={{ uri: msg.senderAvatar }} style={styles.msgAvatar} />
                  )}
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                    {!isMe && circleId && (
                      <Text style={styles.msgSenderName}>{msg.senderName}</Text>
                    )}
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.text}</Text>
                    <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                      {getTimeDisplay(msg.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textTertiary}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim()}
            >
              <Send size={18} color={text.trim() ? Colors.white : Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
    flex: 1,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerGroupAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 18,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  chatArea: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyChatText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    gap: 6,
  },
  messageBubbleRowMe: {
    justifyContent: 'flex-end',
  },
  msgAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  msgSenderName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: Colors.white,
  },
  bubbleTime: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
    alignSelf: 'flex-end' as const,
  },
  bubbleTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surfaceSecondary,
  },
  emptyCenter: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
