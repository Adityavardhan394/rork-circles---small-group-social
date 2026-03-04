import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, Users, Plus, Send, Pin, Calendar, BarChart3, Clipboard, Settings } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';
import PostCard from '@/components/PostCard';
import PollCard from '@/components/PollCard';
import EventCard from '@/components/EventCard';
import BoardItemCard from '@/components/BoardItemCard';
import EmptyState from '@/components/EmptyState';
import { FeedSkeleton } from '@/components/SkeletonLoader';

type TabType = 'feed' | 'plans' | 'board';

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
    rsvpEvent,
    toggleBoardTodo,
    isLoading,
  } = useCircles();

  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [refreshing, setRefreshing] = useState(false);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const circle = getCircleById(id ?? '');
  const posts = getCirclePosts(id ?? '');
  const polls = getCirclePolls(id ?? '');
  const events = getCircleEvents(id ?? '');
  const boardItems = getCircleBoardItems(id ?? '');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    const tabIndex = tab === 'feed' ? 0 : tab === 'plans' ? 1 : 2;
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

  const handleRsvp = useCallback((eventId: string, status: 'yes' | 'maybe' | 'no') => {
    rsvpEvent(eventId, user?.id ?? 'user-1', status);
  }, [rsvpEvent, user]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (!circle) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
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
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <ArrowLeft size={22} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.membersBtn}
                onPress={() => router.push(`/members/${circle.id}`)}
                accessibilityLabel={`View ${circle.members.length} members`}
                accessibilityRole="button"
              >
                <Users size={18} color={Colors.text} />
                <Text style={styles.memberCount}>{circle.members.length}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.circleInfo}>
              <View style={[styles.emojiCircle, { backgroundColor: circle.color + '20' }]}>
                <Text style={styles.emoji}>{circle.emoji}</Text>
              </View>
              <Text style={styles.circleName} accessibilityRole="header">{circle.name}</Text>
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
            </View>
          </View>

          <View style={styles.tabBar}>
            {(['feed', 'plans', 'board'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.tab}
                onPress={() => handleTabChange(tab)}
                accessibilityLabel={`${tab === 'feed' ? 'Feed' : tab === 'plans' ? 'Plans' : 'Board'} tab`}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                {tab === 'feed' && <Send size={15} color={activeTab === tab ? Colors.primary : Colors.textTertiary} />}
                {tab === 'plans' && <Calendar size={15} color={activeTab === tab ? Colors.primary : Colors.textTertiary} />}
                {tab === 'board' && <Clipboard size={15} color={activeTab === tab ? Colors.primary : Colors.textTertiary} />}
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'feed' ? 'Feed' : tab === 'plans' ? 'Plans' : 'Board'}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.tabIndicatorContainer}>
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    transform: [{
                      translateX: tabIndicatorAnim.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [0, 120, 240],
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {activeTab === 'feed' && (
            <>
              <TouchableOpacity
                style={styles.createPostBar}
                onPress={() => router.push(`/create-post?circleId=${circle.id}`)}
                accessibilityLabel="Create a new post"
                accessibilityRole="button"
              >
                <Image source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }} style={styles.userAvatar} />
                <Text style={styles.createPostText}>Share something with {circle.name}...</Text>
              </TouchableOpacity>

              {isLoading ? (
                <FeedSkeleton />
              ) : posts.length === 0 && polls.length === 0 ? (
                <EmptyState
                  emoji="💬"
                  title="No posts yet"
                  subtitle="Be the first to share something!"
                  actionLabel="Create Post"
                  onAction={() => router.push(`/create-post?circleId=${circle.id}`)}
                />
              ) : (
                <>
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onReact={(emoji) => handleReact(post.id, emoji)}
                      onPin={() => togglePin(post.id)}
                      currentUserId={user?.id ?? 'user-1'}
                    />
                  ))}
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
                  accessibilityLabel="Create a quick poll"
                  accessibilityRole="button"
                >
                  <BarChart3 size={18} color={Colors.accent} />
                  <Text style={styles.planActionText}>Quick Poll</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.planActionBtn}
                  onPress={() => router.push(`/create-event?circleId=${circle.id}`)}
                  accessibilityLabel="Create a new event"
                  accessibilityRole="button"
                >
                  <Calendar size={18} color={Colors.primary} />
                  <Text style={styles.planActionText}>New Event</Text>
                </TouchableOpacity>
              </View>

              {polls.length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Active Polls</Text>
                  {polls.map(poll => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      onVote={(optionId) => handleVotePoll(poll.id, optionId)}
                      currentUserId={user?.id ?? 'user-1'}
                    />
                  ))}
                </View>
              )}

              {events.length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Upcoming Events</Text>
                  {events.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onRsvp={(status) => handleRsvp(event.id, status)}
                      currentUserId={user?.id ?? 'user-1'}
                    />
                  ))}
                </View>
              )}

              {polls.length === 0 && events.length === 0 && (
                <EmptyState
                  emoji="📋"
                  title="No plans yet"
                  subtitle="Create a poll or event to get everyone aligned!"
                />
              )}
            </>
          )}

          {activeTab === 'board' && (
            <>
              {boardItems.length > 0 ? (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Pinned Items</Text>
                  {boardItems.map(item => (
                    <BoardItemCard
                      key={item.id}
                      item={item}
                      onToggleTodo={() => toggleBoardTodo(item.id)}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  emoji="📌"
                  title="Board is empty"
                  subtitle="Pin important posts, links, and notes here"
                />
              )}
            </>
          )}
        </ScrollView>
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
  headerContainer: {},
  headerBg: {
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  membersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  memberCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  circleInfo: {
    alignItems: 'center',
    paddingTop: 8,
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 28,
  },
  circleName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  circleDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  avatarRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.surface,
    overflow: 'hidden',
  },
  memberAvatarImg: {
    width: '100%',
    height: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  tabIndicatorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
  },
  tabIndicator: {
    width: 120,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  createPostBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  createPostText: {
    fontSize: 14,
    color: Colors.textTertiary,
    flex: 1,
  },
  planActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  planActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  planActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
});
