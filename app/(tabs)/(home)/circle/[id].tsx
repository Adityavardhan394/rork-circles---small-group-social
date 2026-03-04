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

import Colors from '@/constants/colors';
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
  const { id } = useLocalSearchParams<{ id: string }>();
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

  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    const tabIndex = tab === 'feed' ? 0 : tab === 'plans' ? 1 : tab === 'board' ? 2 : 3;
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
        message: `Join my huddle "${circle.name}" on Huddle! Use invite code: ${circle.inviteCode}`,
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
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <EmptyState emoji="🔍" title="Huddle not found" subtitle="This huddle doesn't exist or has been removed" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
          <View style={[styles.headerBg, { backgroundColor: circle.color + '12' }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <ArrowLeft size={22} color={Colors.text} />
              </TouchableOpacity>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowSearch(!showSearch)}>
                  <Search size={16} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerActionBtn} onPress={handleShare}>
                  <Share2 size={16} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.membersBtn}
                  onPress={() => router.push(`/members/${circle.id}`)}
                >
                  <Users size={16} color={Colors.text} />
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
                  <MessageCircle size={14} color={Colors.primary} />
                  <Text style={styles.quickBtnText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtn} onPress={handleOpenExpenses}>
                  <DollarSign size={14} color={Colors.accent} />
                  <Text style={styles.quickBtnText}>Expenses</Text>
                </TouchableOpacity>
                {isAdmin && (
                  <TouchableOpacity style={styles.quickBtn} onPress={handleOpenAnalytics}>
                    <TrendingUp size={14} color="#7C3AED" />
                    <Text style={styles.quickBtnText}>Analytics</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {showSearch && (
            <View style={styles.searchBarContainer}>
              <Search size={14} color={Colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search posts, polls, events..."
                placeholderTextColor={Colors.textTertiary}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
            </View>
          )}

          <View style={styles.tabBar}>
            {(['feed', 'plans', 'board', 'media'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.tab}
                onPress={() => handleTabChange(tab)}
              >
                {tab === 'feed' && <Send size={14} color={activeTab === tab ? Colors.primary : Colors.textTertiary} />}
                {tab === 'plans' && <Calendar size={14} color={activeTab === tab ? Colors.primary : Colors.textTertiary} />}
                {tab === 'board' && <Clipboard size={14} color={activeTab === tab ? Colors.primary : Colors.textTertiary} />}
                {tab === 'media' && <ImageIcon size={14} color={activeTab === tab ? Colors.primary : Colors.textTertiary} />}
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'feed' ? 'Feed' : tab === 'plans' ? 'Plans' : tab === 'board' ? 'Board' : 'Media'}
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
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
                  <BarChart3 size={18} color={Colors.accent} />
                  <Text style={styles.planActionText}>Quick Poll</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.planActionBtn}
                  onPress={() => router.push(`/create-event?circleId=${circle.id}`)}
                >
                  <Calendar size={18} color={Colors.primary} />
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
                          <Lock size={12} color={Colors.danger} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  headerContainer: {},
  headerBg: { paddingBottom: 12 },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerActionBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  membersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12,
  },
  memberCount: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  circleInfo: { alignItems: 'center', paddingTop: 4 },
  emojiCircle: {
    width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  emoji: { fontSize: 26 },
  circleName: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.3 },
  circleDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 3, textAlign: 'center', paddingHorizontal: 40 },
  avatarRow: { flexDirection: 'row', marginTop: 8 },
  memberAvatar: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.surface, overflow: 'hidden',
  },
  memberAvatarImg: { width: '100%', height: '100%' },
  quickRow: {
    flexDirection: 'row', gap: 8, marginTop: 10,
  },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  quickBtnText: { fontSize: 12, fontWeight: '500' as const, color: Colors.text },
  searchBarContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 4, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.surface, borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  tabBar: {
    flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, backgroundColor: Colors.background, position: 'relative',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10,
  },
  tabText: { fontSize: 12, fontWeight: '500' as const, color: Colors.textTertiary },
  tabTextActive: { color: Colors.primary, fontWeight: '600' as const },
  tabIndicatorContainer: { position: 'absolute', bottom: 0, left: 20, right: 20, height: 2 },
  tabIndicator: { height: 2, backgroundColor: Colors.primary, borderRadius: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 24 },
  createPostBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 14, gap: 10,
  },
  userAvatar: { width: 32, height: 32, borderRadius: 16 },
  createPostText: { fontSize: 14, color: Colors.textTertiary, flex: 1 },
  planActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  planActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.surface, padding: 14, borderRadius: 14,
  },
  planActionText: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  subsection: { marginBottom: 16 },
  subsectionTitle: {
    fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary,
    textTransform: 'uppercase' as const, letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 10,
  },
  closePollBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginHorizontal: 20, marginTop: -6, marginBottom: 12, paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: Colors.danger + '10', borderRadius: 8, alignSelf: 'flex-start',
  },
  closePollText: { fontSize: 12, fontWeight: '500' as const, color: Colors.danger },
  mediaGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 4,
  },
  mediaItem: {
    width: (SCREEN_WIDTH - 40) / 3, height: (SCREEN_WIDTH - 40) / 3,
    borderRadius: 8, overflow: 'hidden',
  },
  mediaImage: { width: '100%', height: '100%' },
});
