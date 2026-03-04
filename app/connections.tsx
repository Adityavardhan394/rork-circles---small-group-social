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
import { ArrowLeft, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useCircles } from '@/providers/CirclesProvider';
import { User } from '@/types';

interface ConnectionWithCircles {
  user: User;
  circleNames: string[];
}

export default function ConnectionsScreen() {
  const router = useRouter();
  const { circles } = useCircles();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const connections = useMemo<ConnectionWithCircles[]>(() => {
    const memberMap = new Map<string, { user: User; circleNames: string[] }>();
    circles.forEach(circle => {
      circle.members.forEach(member => {
        if (member.id === 'user-1') return;
        const existing = memberMap.get(member.id);
        if (existing) {
          existing.circleNames.push(circle.name);
        } else {
          memberMap.set(member.id, { user: member, circleNames: [circle.name] });
        }
      });
    });
    return Array.from(memberMap.values());
  }, [circles]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connections</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.summaryBar}>
          <Users size={16} color={colors.primary} />
          <Text style={styles.summaryText}>
            {connections.length} people across {circles.length} huddles
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {connections.map((conn) => (
            <View key={conn.user.id} style={styles.personCard}>
              <Image
                source={{ uri: conn.user.avatar }}
                style={styles.avatar}
              />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{conn.user.name}</Text>
                <Text style={styles.personCircles} numberOfLines={1}>
                  {conn.circleNames.join(' · ')}
                </Text>
              </View>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {conn.circleNames.length} huddle{conn.circleNames.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          ))}

          {connections.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No connections yet</Text>
              <Text style={styles.emptySubtitle}>
                Join or create huddles to connect with people
              </Text>
            </View>
          )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.teal50,
    borderBottomWidth: 1,
    borderBottomColor: colors.teal100,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  personCircles: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  badgeContainer: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
