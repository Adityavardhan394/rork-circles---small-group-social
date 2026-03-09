import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, TrendingUp, MessageCircle, BarChart3, Calendar, Users } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useCircles } from '@/providers/CirclesProvider';

export default function AnalyticsScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const router = useRouter();
  const { getCircleById, getCirclePosts, getCirclePolls, getCircleEvents } = useCircles();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const circle = getCircleById(circleId ?? '');
  const posts = getCirclePosts(circleId ?? '');
  const polls = getCirclePolls(circleId ?? '');
  const events = getCircleEvents(circleId ?? '');

  const memberActivity = useMemo(() => {
    if (!circle) return [];
    return circle.members.map(member => {
      const postCount = posts.filter(p => p.author.id === member.id).length;
      const pollCount = polls.filter(p => p.author.id === member.id).length;
      const eventCount = events.filter(e => e.author.id === member.id).length;
      const reactionCount = posts.reduce((sum, p) => {
        return sum + Object.values(p.reactions).reduce((rSum, users) => {
          return rSum + (users.includes(member.id) ? 1 : 0);
        }, 0);
      }, 0);
      const total = postCount + pollCount + eventCount + reactionCount;
      return { member, postCount, pollCount, eventCount, reactionCount, total };
    }).sort((a, b) => b.total - a.total);
  }, [circle, posts, polls, events]);

  const totalReactions = useMemo(() => {
    return posts.reduce((sum, p) =>
      sum + Object.values(p.reactions).reduce((rSum, users) => rSum + users.length, 0), 0
    );
  }, [posts]);

  const totalComments = useMemo(() => {
    return posts.reduce((sum, p) => sum + p.comments.length, 0);
  }, [posts]);

  if (!circle) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.circleHeader}>
            <Text style={styles.emoji}>{circle.emoji}</Text>
            <Text style={styles.circleName}>{circle.name}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#DB277815' }]}>
                <MessageCircle size={18} color="#DB2777" />
              </View>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#D9770615' }]}>
                <BarChart3 size={18} color="#D97706" />
              </View>
              <Text style={styles.statValue}>{polls.length}</Text>
              <Text style={styles.statLabel}>Polls</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#2563EB15' }]}>
                <Calendar size={18} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>{events.length}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#0F766E15' }]}>
                <Users size={18} color="#0F766E" />
              </View>
              <Text style={styles.statValue}>{circle.members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
          </View>

          <View style={styles.engagementCard}>
            <View style={styles.engagementRow}>
              <TrendingUp size={16} color={colors.primary} />
              <Text style={styles.engagementTitle}>Engagement</Text>
            </View>
            <View style={styles.engagementStats}>
              <View style={styles.engagementStat}>
                <Text style={styles.engagementValue}>{totalReactions}</Text>
                <Text style={styles.engagementLabel}>Reactions</Text>
              </View>
              <View style={styles.engDivider} />
              <View style={styles.engagementStat}>
                <Text style={styles.engagementValue}>{totalComments}</Text>
                <Text style={styles.engagementLabel}>Comments</Text>
              </View>
              <View style={styles.engDivider} />
              <View style={styles.engagementStat}>
                <Text style={styles.engagementValue}>
                  {events.reduce((sum, e) => sum + e.rsvps.yes.length, 0)}
                </Text>
                <Text style={styles.engagementLabel}>RSVPs</Text>
              </View>
            </View>
          </View>

          <View style={styles.leaderboardSection}>
            <Text style={styles.sectionTitle}>Most Active Members</Text>
            {memberActivity.map((item, index) => (
              <View key={item.member.id} style={styles.leaderRow}>
                <Text style={styles.leaderRank}>#{index + 1}</Text>
                <Image source={{ uri: item.member.avatar }} style={styles.leaderAvatar} />
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>{item.member.name}</Text>
                  <Text style={styles.leaderStats}>
                    {item.postCount}p · {item.pollCount}pl · {item.eventCount}e · {item.reactionCount}r
                  </Text>
                </View>
                <View style={styles.leaderScore}>
                  <Text style={styles.leaderScoreText}>{item.total}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  scrollContent: { paddingBottom: 40 },
  circleHeader: { alignItems: 'center', paddingVertical: 20 },
  emoji: { fontSize: 40, marginBottom: 8 },
  circleName: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 20, marginBottom: 20,
  },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.surface,
    borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  statLabel: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  engagementCard: {
    backgroundColor: colors.surface, marginHorizontal: 20,
    borderRadius: 16, padding: 16, marginBottom: 24,
  },
  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  engagementTitle: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
  engagementStats: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  engagementStat: { alignItems: 'center', flex: 1 },
  engagementValue: { fontSize: 20, fontWeight: '700' as const, color: colors.primaryDark },
  engagementLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  engDivider: { width: 1, height: 28, backgroundColor: colors.borderLight },
  leaderboardSection: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary,
    textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10,
  },
  leaderRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, padding: 12, borderRadius: 14, marginBottom: 6,
  },
  leaderRank: { fontSize: 14, fontWeight: '700' as const, color: colors.textTertiary, width: 28 },
  leaderAvatar: { width: 36, height: 36, borderRadius: 18 },
  leaderInfo: { flex: 1, marginLeft: 10 },
  leaderName: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
  leaderStats: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  leaderScore: {
    backgroundColor: colors.teal50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  leaderScoreText: { fontSize: 14, fontWeight: '700' as const, color: colors.primary },
});
