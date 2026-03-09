import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  TextInput,
  Share,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ArrowLeft, Users, Send, Calendar, BarChart3, Clipboard,
  MessageCircle, Search, TrendingUp, DollarSign, Share2,
  ImageIcon, Lock,
} from 'lucide-react-native';

import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';
import PostCard from '@/components/PostCard';
import PollCard from '@/components/PollCard';
import EventCard from '@/components/EventCard';
import BoardItemCard from '@/components/BoardItemCard';
import EmptyState from '@/components/EmptyState';
import { FeedSkeleton } from '@/components/SkeletonLoader';

type TabType = 'feed' | 'plans' | 'board' | 'media';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_COUNT = 4;
const TAB_WIDTH = (SCREEN_WIDTH - 40) / TAB_COUNT;

export default function CircleDetailScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const { user } = useUser();
  const {
    getCircleById,
    getCirclePosts,
    getCirclePolls,
    getCircleEvents,
    getCircleBoardItems,
    toggleReaction,
    togglePin,
    votePoll,
    closePoll,
    rsvpEvent,
    toggleBoardTodo,
    isLoading,
  } = useCircles();

  const initialTab = (tab === 'plans' || tab === 'board' || tab === 'media') ? tab : 'feed';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const circle = getCircleById(id ?? '');
  const posts = getCirclePosts(id ?? '');
  const allPolls = getCirclePolls(id ?? '');
  const events = getCircleEvents(id ?? '');
  const boardItems = getCircleBoardItems(id ?? '');

  const now = new Date();
  const activePolls = allPolls.filter(p => !p.closed && new Date(p.expiresAt) > now);
  const pastPolls = allPolls.filter(p => p.closed || new Date(p.expiresAt) <= now);

  const mediaUrls = useMemo(() => {
    return posts.flatMap(p => p.mediaUrls).filter(Boolean);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!searchText.trim()) return posts;
    const q = searchText.toLowerCase();
    return posts.filter(p =>
      (p.text?.toLowerCase().includes(q)) ||
      p.author.name.toLowerCase().includes(q)
    );
  }, [posts, searchText]);

  const filteredPolls = useMemo(() => {
    if (!searchText.trim()) return allPolls;
    const q = searchText.toLowerCase();
    return allPolls.filter(p => p.question.toLowerCase().includes(q));
  }, [allPolls, searchText]);

  const filteredEvents = useMemo(() => {
    if (!searchText.trim()) return events;
    const q = searchText.toLowerCase();
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.description?.toLowerCase().includes(q)) ||
      (e.location?.toLowerCase().includes(q))
    );
  }, [events, searchText]);

  const isAdmin = circle?.admins.includes(user?.id ?? '') ?? false;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (initialTab !== 'feed') {
      const tabIndex = initialTab === 'plans' ? 1 : initialTab === 'board' ? 2 : 3;
      tabIndicatorAnim.setValue(tabIndex);
    }
  }, [initialTab, tabIndicatorAnim]);

  const handleTabChange = useCallback((newTab: TabType) => {
    setActiveTab(newTab);
    const tabIndex = newTab === 'feed' ? 0 : newTab === 'plans' ? 1 : newTab === 'board' ? 2 : 3;
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [tabIndicatorAnim]);

  const handleReact = useCallback((postId: string, emoji: string) => {
    toggleReaction(postId, emoji, user?.id ?? 'user-1');
  }, [toggleReaction, user]);

  const handleVotePoll = useCallback((pollId: string, optionId: string) => {
    votePoll(pollId, optionId, user?.id ?? 'user-1');
  }, [votePoll, user]);

  const handleClosePoll = useCallback((pollId: string) => {
    closePoll(pollId);
  }, [closePoll]);

  const handleRsvp = useCallback((eventId: string, status: 'yes' | 'maybe' | 'no') => {
    rsvpEvent(eventId, user?.id ?? 'user-1', status);
  }, [rsvpEvent, user]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleShare = useCallback(async () => {
    if (!circle) return;
    try {
      await Share.share({
        message: `Join my group "${circle.name}" on Huddle! Use invite code: ${circle.inviteCode}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  }, [circle]);

  const handleOpenChat = useCallback(() => {
    if (!circle) return;
    router.push(`/chat?circleId=${circle.id}` as never);
  }, [circle, router]);

  const handleOpenExpenses = useCallback(() => {
    if (!circle) return;
    router.push(`/expenses?circleId=${circle.id}` as never);
  }, [circle, router]);

  const handleOpenAnalytics = useCallback(() => {
    if (!circle) return;
    router.push(`/analytics?circleId=${circle.id}` as never);
  }, [circle, router]);

  if (!circle) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <EmptyState emoji="🔍" title="Group not found" subtitle="This group doesn't exist or has been removed" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
          <View style={styles.headerBg}>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <ArrowLeft size={22} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowSearch(!showSearch)}>
                  <Search size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerActionBtn} onPress={handleShare}>
                  <Share2 size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.membersBtn}
                  onPress={() => router.push(`/members/${circle.id}`)}
                >
                  <Users size={16} color={colors.text} />
                  <Text style={styles.memberCount}>{circle.members.length}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.circleInfo}>
              <View style={[styles.emojiCircle, { backgroundColor: circle.color + '20' }]}>
                <Text style={styles.emoji}>{circle.emoji}</Text>
              </View>
              <Text style={styles.circleName}>{circle.name}</Text>
              {circle.description ? (
                <Text style={styles.circleDesc}>{circle.description}</Text>
              ) : null}
              <View style={styles.avatarRow}>
                {circle.members.slice(0, 5).map((member, i) => (
                  <View key={member.id} style={[styles.memberAvatar, { marginLeft: i > 0 ? -6 : 0, zIndex: 5 - i }]}>
                    <Image source={{ uri: member.avatar }} style={styles.memberAvatarImg} />
                  </View>
                ))}
              </View>

              <View style={styles.quickRow}>
                <TouchableOpacity style={styles.quickBtn} onPress={handleOpenChat}>
                  <MessageCircle size={14} color={colors.primary} />
                  <Text style={styles.quickBtnText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtn} onPress={handleOpenExpenses}>
                  <DollarSign size={14} color={colors.accentLight} />
                  <Text style={styles.quickBtnText}>Expenses</Text>
                </TouchableOpacity>
                {isAdmin && (
                  <TouchableOpacity style={styles.quickBtn} onPress={handleOpenAnalytics}>
                    <TrendingUp size={14} color="#7B6FE8" />
                    <Text style={styles.quickBtnText}>Analytics</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {showSearch && (
            <View style={styles.searchBarContainer}>
              <Search size={14} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search posts, polls, events..."
                placeholderTextColor={colors.textTertiary}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
            </View>
          )}

          <View style={styles.tabBar}>
            {(['feed', 'plans', 'board', 'media'] as TabType[]).map((tabItem) => (
              <TouchableOpacity
                key={tabItem}
                style={styles.tab}
                onPress={() => handleTabChange(tabItem)}
              >
                {tabItem === 'feed' && <Send size={14} color={activeTab === tabItem ? colors.primary : colors.textTertiary} />}
                {tabItem === 'plans' && <Calendar size={14} color={activeTab === tabItem ? colors.primary : colors.textTertiary} />}
                {tabItem === 'board' && <Clipboard size={14} color={activeTab === tabItem ? colors.primary : colors.textTertiary} />}
                {tabItem === 'media' && <ImageIcon size={14} color={activeTab === tabItem ? colors.primary : colors.textTertiary} />}
                <Text style={[styles.tabText, activeTab === tabItem && styles.tabTextActive]}>
                  {tabItem === 'feed' ? 'Feed' : tabItem === 'plans' ? 'Plans' : tabItem === 'board' ? 'Board' : 'Media'}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.tabIndicatorContainer}>
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    width: TAB_WIDTH,
                    transform: [{
                      translateX: tabIndicatorAnim.interpolate({
                        inputRange: [0, 1, 2, 3],
                        outputRange: [0, TAB_WIDTH, TAB_WIDTH * 2, TAB_WIDTH * 3],
                      }),
                    }],
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {activeTab === 'feed' && (
            <>
              <TouchableOpacity
                style={styles.createPostBar}
                onPress={() => router.push(`/create-post?circleId=${circle.id}`)}
              >
                <Image source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }} style={styles.userAvatar} />
                <Text style={styles.createPostText}>Share something with {circle.name}...</Text>
              </TouchableOpacity>

              {isLoading ? (
                <FeedSkeleton />
              ) : filteredPosts.length === 0 && !searchText ? (
                <EmptyState
                  emoji="💬"
                  title="No posts yet"
                  subtitle="Be the first to share something!"
                  actionLabel="Create Post"
                  onAction={() => router.push(`/create-post?circleId=${circle.id}`)}
                />
              ) : (
                <>
                  {filteredPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onReact={(emoji) => handleReact(post.id, emoji)}
                      onPin={() => togglePin(post.id)}
                      currentUserId={user?.id ?? 'user-1'}
                    />
                  ))}
                  {searchText && filteredPosts.length === 0 && (
                    <EmptyState emoji="🔍" title="No results" subtitle={`No posts matching "${searchText}"`} />
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'plans' && (
            <>
              <View style={styles.planActions}>
                <TouchableOpacity
                  style={styles.planActionBtn}
                  onPress={() => router.push(`/create-poll?circleId=${circle.id}`)}
                >
                  <BarChart3 size={18} color={colors.accentLight} />
                  <Text style={styles.planActionText}>Quick Poll</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.planActionBtn}
                  onPress={() => router.push(`/create-event?circleId=${circle.id}`)}
                >
                  <Calendar size={18} color={colors.primary} />
                  <Text style={styles.planActionText}>New Event</Text>
                </TouchableOpacity>
              </View>

              {activePolls.length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Active Polls</Text>
                  {(searchText ? filteredPolls.filter(p => !p.closed && new Date(p.expiresAt) > now) : activePolls).map(poll => (
                    <View key={poll.id}>
                      <PollCard
                        poll={poll}
                        onVote={(optionId) => handleVotePoll(poll.id, optionId)}
                        currentUserId={user?.id ?? 'user-1'}
                      />
                      {isAdmin && (
                        <TouchableOpacity
                          style={styles.closePollBtn}
                          onPress={() => handleClosePoll(poll.id)}
                        >
                          <Lock size={12} color={colors.danger} />
                          <Text style={styles.closePollText}>Close Poll</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {pastPolls.length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Past Polls</Text>
                  {(searchText ? filteredPolls.filter(p => p.closed || new Date(p.expiresAt) <= now) : pastPolls).map(poll => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      onVote={(optionId) => handleVotePoll(poll.id, optionId)}
                      currentUserId={user?.id ?? 'user-1'}
                    />
                  ))}
                </View>
              )}

              {(searchText ? filteredEvents : events).length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Upcoming Events</Text>
                  {(searchText ? filteredEvents : events).map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onRsvp={(status) => handleRsvp(event.id, status)}
                      currentUserId={user?.id ?? 'user-1'}
                    />
                  ))}
                </View>
              )}

              {activePolls.length === 0 && pastPolls.length === 0 && events.length === 0 && (
                <EmptyState emoji="📋" title="No plans yet" subtitle="Create a poll or event to get everyone aligned!" />
              )}
            </>
          )}

          {activeTab === 'board' && (
            <>
              {boardItems.length > 0 ? (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Pinned Items</Text>
                  {boardItems.map(item => (
                    <BoardItemCard key={item.id} item={item} onToggleTodo={() => toggleBoardTodo(item.id)} />
                  ))}
                </View>
              ) : (
                <EmptyState emoji="📌" title="Board is empty" subtitle="Pin important posts, links, and notes here" />
              )}
            </>
          )}

          {activeTab === 'media' && (
            <>
              {mediaUrls.length > 0 ? (
                <View style={styles.mediaGrid}>
                  {mediaUrls.map((url, index) => (
                    <View key={index} style={styles.mediaItem}>
                      <Image source={{ uri: url }} style={styles.mediaImage} contentFit="cover" />
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState emoji="📸" title="No media yet" subtitle="Photos shared in posts will appear here" />
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  headerContainer: {},
  headerBg: { paddingBottom: 12, backgroundColor: colors.surface, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerActionBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  membersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceSecondary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
  },
  memberCount: { fontSize: 13, fontWeight: '600' as const, color: colors.text },
  circleInfo: { alignItems: 'center', paddingTop: 4 },
  emojiCircle: {
    width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  emoji: { fontSize: 26 },
  circleName: { fontSize: 22, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.3 },
  circleDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 3, textAlign: 'center', paddingHorizontal: 40 },
  avatarRow: { flexDirection: 'row', marginTop: 8 },
  memberAvatar: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.surface, overflow: 'hidden',
  },
  memberAvatarImg: { width: '100%', height: '100%' },
  quickRow: {
    flexDirection: 'row', gap: 8, marginTop: 12,
  },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceSecondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
  },
  quickBtnText: { fontSize: 12, fontWeight: '500' as const, color: colors.text },
  searchBarContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 8, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.inputBg, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  tabBar: {
    flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.background, position: 'relative',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10,
  },
  tabText: { fontSize: 12, fontWeight: '500' as const, color: colors.textTertiary },
  tabTextActive: { color: colors.primary, fontWeight: '600' as const },
  tabIndicatorContainer: { position: 'absolute', bottom: 0, left: 20, right: 20, height: 2 },
  tabIndicator: { height: 2, backgroundColor: colors.primary, borderRadius: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 24 },
  createPostBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 18, gap: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  userAvatar: { width: 34, height: 34, borderRadius: 17 },
  createPostText: { fontSize: 14, color: colors.textTertiary, flex: 1 },
  planActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  planActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surface, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.border,
  },
  planActionText: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
  subsection: { marginBottom: 16 },
  subsectionTitle: {
    fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary,
    textTransform: 'uppercase' as const, letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 10,
  },
  closePollBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginHorizontal: 20, marginTop: -6, marginBottom: 12, paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, alignSelf: 'flex-start',
  },
  closePollText: { fontSize: 12, fontWeight: '500' as const, color: colors.danger },
  mediaGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 4,
  },
  mediaItem: {
    width: (SCREEN_WIDTH - 40) / 3, height: (SCREEN_WIDTH - 40) / 3,
    borderRadius: 12, overflow: 'hidden',
  },
  mediaImage: { width: '100%', height: '100%' },
});
