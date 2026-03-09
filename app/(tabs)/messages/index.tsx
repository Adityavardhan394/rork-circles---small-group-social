import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Search, Edit3 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useMessages } from '@/providers/MessagesProvider';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { dmConversations } = useMessages();
  const { circles } = useCircles();
  const [searchText, setSearchText] = useState('');
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const allConnections = useMemo(() => {
    const memberMap = new Map<string, { id: string; name: string; avatar: string }>();
    circles.forEach(circle => {
      circle.members.forEach(member => {
        if (member.id !== user?.id) {
          memberMap.set(member.id, { id: member.id, name: member.name, avatar: member.avatar });
        }
      });
    });
    return Array.from(memberMap.values());
  }, [circles, user?.id]);

  const filteredConnections = useMemo(() => {
    if (!searchText.trim()) return allConnections;
    return allConnections.filter(c =>
      c.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [allConnections, searchText]);

  const handleOpenDM = useCallback((memberId: string) => {
    router.push(`/chat?userId=${memberId}` as never);
  }, [router]);

  const handleOpenGroupChat = useCallback((circleId: string) => {
    router.push(`/chat?circleId=${circleId}` as never);
  }, [router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <TouchableOpacity style={styles.composeBtn}>
            <Edit3 size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search size={16} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={colors.textTertiary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {circles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Group Chats</Text>
              {circles.map(circle => (
                <TouchableOpacity
                  key={circle.id}
                  style={styles.chatRow}
                  onPress={() => handleOpenGroupChat(circle.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.groupAvatar, { backgroundColor: circle.color + '20' }]}>
                    <Text style={styles.groupEmoji}>{circle.emoji}</Text>
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>{circle.name}</Text>
                    <Text style={styles.chatPreview} numberOfLines={1}>
                      {circle.members.length} members · Tap to chat
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Direct Messages</Text>
            {dmConversations.length > 0 ? (
              dmConversations.map(conv => {
                const otherUser = conv.participants.find(p => p.id !== user?.id);
                if (!otherUser) return null;
                return (
                  <TouchableOpacity
                    key={conv.id}
                    style={styles.chatRow}
                    onPress={() => handleOpenDM(otherUser.id)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: otherUser.avatar }} style={styles.dmAvatar} />
                    <View style={styles.chatInfo}>
                      <View style={styles.chatNameRow}>
                        <Text style={styles.chatName}>{otherUser.name}</Text>
                        {conv.lastMessage && (
                          <Text style={styles.chatTime}>
                            {getTimeAgo(conv.lastMessage.createdAt)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.chatPreview} numberOfLines={1}>
                        {conv.lastMessage?.text ?? 'Start a conversation'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : null}

            {filteredConnections.length > 0 && (
              <>
                <Text style={styles.subLabel}>People you can message</Text>
                {filteredConnections.map(conn => (
                  <TouchableOpacity
                    key={conn.id}
                    style={styles.chatRow}
                    onPress={() => handleOpenDM(conn.id)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: conn.avatar }} style={styles.dmAvatar} />
                    <View style={styles.chatInfo}>
                      <Text style={styles.chatName}>{conn.name}</Text>
                      <Text style={styles.chatPreview}>Tap to message</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {filteredConnections.length === 0 && dmConversations.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySubtitle}>
                  Join a group to start messaging people
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  composeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(91,76,219,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textTertiary,
    marginTop: 16,
    marginBottom: 8,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEmoji: {
    fontSize: 22,
  },
  dmAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  chatTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  chatPreview: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
