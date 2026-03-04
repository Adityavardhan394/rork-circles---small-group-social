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
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Sparkles,
  Calendar,
  BarChart3,
  MessageCircle,
  MapPin,
  Clock,
  Settings,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';
import CircleCard from '@/components/CircleCard';
import EmptyState from '@/components/EmptyState';
import { HomeSkeleton } from '@/components/SkeletonLoader';

const QUICK_ACTIONS = [
  { id: 'circle', label: 'New Huddle', icon: Users, color: '#0F766E', bg: '#F0FDFA', route: '/create-circle' },
  { id: 'event', label: 'Event', icon: Calendar, color: '#2563EB', bg: '#EFF6FF', route: '/create-event' },
  { id: 'poll', label: 'Poll', icon: BarChart3, color: '#D97706', bg: '#FFFBEB', route: '/create-poll' },
  { id: 'post', label: 'Post', icon: MessageCircle, color: '#DB2777', bg: '#FDF2F8', route: '/create-post' },
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
  const animStarted = useRef(false);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const handleSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const handleConnectionsPress = useCallback(() => {
    router.push('/connections');
  }, [router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarSkeleton} />
              <View>
                <View style={{ width: 120, height: 16, backgroundColor: Colors.stone200, borderRadius: 8 }} />
                <View style={{ width: 80, height: 12, backgroundColor: Colors.stone200, borderRadius: 6, marginTop: 6 }} />
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
              tintColor={Colors.primary}
              colors={[Colors.primary]}
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
                  <Text style={styles.greetingSmall}>{getTimeGreeting()}</Text>
                  <Text style={styles.userName} numberOfLines={1}>{user?.name ?? 'there'}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={handleSettings}
                testID="settings-btn"
                accessibilityLabel="Settings"
              >
                <Settings size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {circles.length > 0 && (
              <View style={styles.statsStrip}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{circles.length}</Text>
                  <Text style={styles.statLabel}>Huddles</Text>
                </View>
                <View style={styles.statDivider} />
                <TouchableOpacity style={styles.statItem} onPress={handleConnectionsPress} activeOpacity={0.7}>
                  <Text style={styles.statNumber}>{totalMembers}</Text>
                  <Text style={styles.statLabel}>People</Text>
                </TouchableOpacity>
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
                    <Calendar size={15} color={Colors.accent} />
                    <Text style={styles.sectionTitle}>Upcoming</Text>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.eventsScroll}
                >
                  {upcomingEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.eventCard}
                      activeOpacity={0.8}
                      onPress={() => router.push(`/circle/${event.circleId}?tab=plans`)}
                    >
                      <View style={styles.eventCardTop}>
                        <Text style={styles.eventEmoji}>{event.circleEmoji}</Text>
                        <View style={styles.eventRsvpBadge}>
                          <Text style={styles.eventRsvpText}>
                            {event.rsvps.yes.length} going
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                      <View style={styles.eventMeta}>
                        <Clock size={11} color={Colors.textTertiary} />
                        <Text style={styles.eventMetaText}>{event.date} · {event.time}</Text>
                      </View>
                      {event.location && (
                        <View style={styles.eventMeta}>
                          <MapPin size={11} color={Colors.textTertiary} />
                          <Text style={styles.eventMetaText} numberOfLines={1}>{event.location}</Text>
                        </View>
                      )}
                      <Text style={styles.eventCircleName} numberOfLines={1}>{event.circleName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {circles.length > 0 ? (
              <View style={styles.circlesSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderLeft}>
                    <Sparkles size={15} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>Your Huddles</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.newCircleChip}
                    onPress={() => handleQuickAction('/create-circle')}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={Colors.primary} />
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
                title="No huddles yet"
                subtitle="Create your first huddle and invite your gang!"
                actionLabel="Create Huddle"
                onAction={() => handleQuickAction('/create-circle')}
              />
            )}
          </Animated.View>
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
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: Colors.primary,
    padding: 2,
    position: 'relative' as const,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  onlineIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2.5,
    borderColor: Colors.background,
  },
  greetingSmall: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    maxWidth: 200,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSkeleton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.stone200,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderLight,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
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
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  eventsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  eventCard: {
    width: 180,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventEmoji: {
    fontSize: 22,
  },
  eventRsvpBadge: {
    backgroundColor: Colors.teal50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  eventRsvpText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  eventMetaText: {
    fontSize: 11,
    color: Colors.textTertiary,
    flex: 1,
  },
  eventCircleName: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginTop: 6,
  },
  circlesSection: {
    marginTop: 24,
  },
  newCircleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.teal50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  newCircleChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
