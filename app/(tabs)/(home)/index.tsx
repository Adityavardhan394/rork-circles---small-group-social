import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Calendar,
  BarChart3,
  MessageCircle,
  MapPin,
  Clock,
  Search,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';
import CircleCard from '@/components/CircleCard';
import EmptyState from '@/components/EmptyState';
import { HomeSkeleton } from '@/components/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_PILLS = ['All', 'Music', 'Sports', 'Study', 'Travel', 'Gaming'] as const;

const QUICK_ACTIONS = [
  { id: 'circle', label: 'New Group', icon: Users, color: '#5B4CDB', bg: 'rgba(91,76,219,0.15)', route: '/create-circle' },
  { id: 'event', label: 'Event', icon: Calendar, color: '#10B981', bg: 'rgba(16,185,129,0.15)', route: '/create-event' },
  { id: 'poll', label: 'Poll', icon: BarChart3, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', route: '/create-poll' },
  { id: 'post', label: 'Post', icon: MessageCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.15)', route: '/create-post' },
] as const;

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { circles, events, posts, getCirclePosts, getCircleEvents } = useCircles();
  const { user, onboarded, isLoading } = useUser();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const headerSlide = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const animStarted = useRef(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const upcomingEvents = useMemo(() => {
    return events.slice(0, 4).map(event => {
      const circle = circles.find(c => c.id === event.circleId);
      return { ...event, circleName: circle?.name ?? '', circleEmoji: circle?.emoji ?? '' };
    });
  }, [events, circles]);

  const totalMembers = useMemo(() => {
    const memberIds = new Set<string>();
    circles.forEach(c => c.members.forEach(m => memberIds.add(m.id)));
    return memberIds.size;
  }, [circles]);

  useEffect(() => {
    if (isLoading || hasNavigated.current) return;

    if (!onboarded) {
      hasNavigated.current = true;
      const timer = setTimeout(() => {
        router.replace('/onboarding');
      }, 100);
      return () => clearTimeout(timer);
    }

    if (!animStarted.current && onboarded) {
      animStarted.current = true;
      fadeAnim.setValue(0);
      headerSlide.setValue(-20);
      contentSlide.setValue(40);
      Animated.stagger(80, [
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(headerSlide, { toValue: 0, useNativeDriver: true, friction: 8 }),
        ]),
        Animated.spring(contentSlide, { toValue: 0, useNativeDriver: true, friction: 8 }),
      ]).start();
    }
  }, [onboarded, isLoading, fadeAnim, headerSlide, contentSlide, router]);

  const getCircleSubtitle = useCallback((circleId: string): string => {
    const circlePosts = getCirclePosts(circleId);
    const circleEvents = getCircleEvents(circleId);
    const recentPosts = circlePosts.length;
    const upcomingEvts = circleEvents.length;
    const parts: string[] = [];
    if (recentPosts > 0) parts.push(`${recentPosts} post${recentPosts > 1 ? 's' : ''}`);
    if (upcomingEvts > 0) parts.push(`${upcomingEvts} event${upcomingEvts > 1 ? 's' : ''}`);
    return parts.join(' · ') || 'No activity yet';
  }, [getCirclePosts, getCircleEvents]);

  const handleQuickAction = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as never);
  }, [router]);

  const handleCirclePress = useCallback((circleId: string) => {
    router.push(`/circle/${circleId}`);
  }, [router]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSearchPress = useCallback(() => {
    router.push('/(tabs)/search' as never);
  }, [router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarSkeleton} />
              <View>
                <View style={{ width: 120, height: 16, backgroundColor: colors.surfaceSecondary, borderRadius: 8 }} />
                <View style={{ width: 80, height: 12, backgroundColor: colors.surfaceSecondary, borderRadius: 6, marginTop: 6 }} />
              </View>
            </View>
          </View>
          <HomeSkeleton />
        </SafeAreaView>
      </View>
    );
  }

  if (!onboarded) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <HomeSkeleton />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: headerSlide }] }}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.avatarRing}>
                  <Image
                    source={{ uri: user?.avatar }}
                    style={styles.headerAvatar}
                    testID="user-avatar"
                  />
                  <View style={styles.onlineIndicator} />
                </View>
                <View>
                  <Text style={styles.userName} numberOfLines={1}>{user?.name ?? 'there'}</Text>
                  <Text style={styles.greetingSmall}>{getTimeGreeting()}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={handleSearchPress}
                testID="search-btn"
                accessibilityLabel="Search"
              >
                <Search size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>GroupStream</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillsContainer}
              >
                {CATEGORY_PILLS.map((pill) => (
                  <TouchableOpacity
                    key={pill}
                    style={[styles.pill, selectedCategory === pill && styles.pillActive]}
                    onPress={() => setSelectedCategory(pill)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, selectedCategory === pill && styles.pillTextActive]}>
                      {pill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {circles.length > 0 && (
              <View style={styles.statsStrip}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{circles.length}</Text>
                  <Text style={styles.statLabel}>Groups</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{totalMembers}</Text>
                  <Text style={styles.statLabel}>People</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{upcomingEvents.length}</Text>
                  <Text style={styles.statLabel}>Events</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{posts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
              </View>
            )}
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: contentSlide }] }}>
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionLabel}>Quick Actions</Text>
              <View style={styles.quickActionsRow}>
                {QUICK_ACTIONS.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.quickActionBtn}
                      onPress={() => handleQuickAction(action.route)}
                      activeOpacity={0.7}
                      testID={`quick-action-${action.id}`}
                    >
                      <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                        <IconComponent size={22} color={action.color} />
                      </View>
                      <Text style={styles.quickActionLabel}>{action.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {upcomingEvents.length > 0 && (
              <View style={styles.eventsSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderLeft}>
                    <Calendar size={15} color={colors.accentLight} />
                    <Text style={styles.sectionTitle}>Upcoming</Text>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.eventsScroll}
                >
                  {upcomingEvents.map((event, index) => {
                    const cardColors = [colors.cardYellow, colors.cardMint, colors.cardLavender, colors.cardPeach];
                    const textColors = [colors.cardYellowText, colors.cardMintText, colors.cardLavenderText, colors.cardPeachText];
                    const cardBg = cardColors[index % cardColors.length];
                    const cardText = textColors[index % textColors.length];
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[styles.eventCard, { backgroundColor: cardBg }]}
                        activeOpacity={0.8}
                        onPress={() => router.push(`/circle/${event.circleId}?tab=plans`)}
                      >
                        <View style={styles.eventCardTop}>
                          <Text style={[styles.eventEmoji, { color: cardText }]}>{event.circleEmoji}</Text>
                          <View style={[styles.eventRsvpBadge, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                            <Text style={[styles.eventRsvpText, { color: cardText }]}>
                              {event.rsvps.yes.length} going
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.eventTitle, { color: cardText }]} numberOfLines={1}>{event.title}</Text>
                        <View style={styles.eventMeta}>
                          <Clock size={11} color={cardText} />
                          <Text style={[styles.eventMetaText, { color: cardText }]}>{event.date} · {event.time}</Text>
                        </View>
                        {event.location && (
                          <View style={styles.eventMeta}>
                            <MapPin size={11} color={cardText} />
                            <Text style={[styles.eventMetaText, { color: cardText }]} numberOfLines={1}>{event.location}</Text>
                          </View>
                        )}
                        <View style={styles.eventJoinRow}>
                          <Text style={[styles.eventCircleName, { color: cardText }]} numberOfLines={1}>{event.circleName}</Text>
                          <View style={[styles.joinBtn, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                            <Text style={[styles.joinBtnText, { color: cardText }]}>Join now</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {circles.length > 0 ? (
              <View style={styles.circlesSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderLeft}>
                    <Text style={styles.sectionTitle}>Popular Group</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.newCircleChip}
                    onPress={() => handleQuickAction('/create-circle')}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={colors.primary} />
                    <Text style={styles.newCircleChipText}>New</Text>
                  </TouchableOpacity>
                </View>
                {circles.map(circle => (
                  <CircleCard
                    key={circle.id}
                    circle={circle}
                    latestActivity={getCircleSubtitle(circle.id)}
                    onPress={() => handleCirclePress(circle.id)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                emoji="🫧"
                title="No groups yet"
                subtitle="Create your first group and invite your gang!"
                actionLabel="Create Group"
                onAction={() => handleQuickAction('/create-circle')}
              />
            )}
          </Animated.View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 2,
    position: 'relative' as const,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  onlineIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  greetingSmall: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400' as const,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.3,
    maxWidth: 200,
  },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -1,
    marginBottom: 16,
  },
  pillsContainer: {
    gap: 8,
    paddingRight: 20,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.pillBg,
  },
  pillActive: {
    backgroundColor: colors.pillActiveBg,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.white,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  eventsSection: {
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  eventsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  eventCard: {
    width: SCREEN_WIDTH * 0.7,
    borderRadius: 20,
    padding: 16,
  },
  eventCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  eventEmoji: {
    fontSize: 22,
  },
  eventRsvpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventRsvpText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 12,
    flex: 1,
  },
  eventJoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  eventCircleName: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  circlesSection: {
    marginTop: 24,
  },
  newCircleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(91,76,219,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  newCircleChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
  },
});
