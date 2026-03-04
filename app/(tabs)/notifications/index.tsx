import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { CheckCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useCircles } from '@/providers/CirclesProvider';
import EmptyState from '@/components/EmptyState';
import { NotificationSkeleton } from '@/components/SkeletonLoader';

export default function NotificationsScreen() {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount, isLoading } = useCircles();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleNotifPress = useCallback((notifId: string, circleId: string) => {
    markNotificationRead(notifId);
    router.push(`/circle/${circleId}`);
  }, [markNotificationRead, router]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.title} accessibilityRole="header">Activity</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={markAllNotificationsRead}
              accessibilityLabel="Mark all as read"
              accessibilityRole="button"
            >
              <CheckCheck size={16} color={Colors.primary} />
              <Text style={styles.markAllText}>Read all</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {isLoading ? (
            <View>
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </View>
          ) : notifications.length === 0 ? (
            <EmptyState
              emoji="🔔"
              title="No notifications"
              subtitle="You're all caught up! Activity from your huddles will show here."
            />
          ) : (
            notifications.map(notif => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
                onPress={() => handleNotifPress(notif.id, notif.circleId)}
                activeOpacity={0.7}
                accessibilityLabel={`${notif.body}, ${getTimeAgo(notif.createdAt)} ago${!notif.read ? ', unread' : ''}`}
                accessibilityRole="button"
              >
                <View style={styles.notifLeft}>
                  <Image source={{ uri: notif.actorAvatar }} style={styles.notifAvatar} />
                  {!notif.read && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifTopRow}>
                    <Text style={styles.notifCircle}>{notif.circleEmoji} {notif.circleName}</Text>
                    <Text style={styles.notifTime}>{getTimeAgo(notif.createdAt)}</Text>
                  </View>
                  <Text style={[styles.notifBody, !notif.read && styles.notifBodyUnread]} numberOfLines={2}>
                    {notif.body}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.teal50,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  notifCard: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  notifCardUnread: {
    backgroundColor: Colors.teal50,
  },
  notifLeft: {
    position: 'relative',
  },
  notifAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.teal50,
  },
  notifContent: {
    flex: 1,
    marginLeft: 12,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  notifCircle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  notifBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  notifBodyUnread: {
    color: Colors.text,
    fontWeight: '500' as const,
  },
});
