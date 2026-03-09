import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Hash, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useCircles } from '@/providers/CirclesProvider';

const CARD_COLORS = ['#F5D5A8', '#B8E6C8', '#C5B8E8', '#F5D76E', '#A8D4F5', '#F5B8D5'];
const CARD_TEXT_COLORS = ['#5C3D1A', '#1A4D2E', '#2E1A5C', '#5C4D1A', '#1A3D5C', '#5C1A3D'];

const SUGGESTED_CIRCLES = [
  { emoji: '🏠', name: 'Flatmate Huddle', desc: 'For roommates & flatmates' },
  { emoji: '💪', name: 'Gym Buddies', desc: 'Workout partners & accountability' },
  { emoji: '🎓', name: 'College Gang', desc: 'Your batch, your memories' },
  { emoji: '🚀', name: 'Side Project Team', desc: 'Build something together' },
  { emoji: '🍜', name: 'Foodie Friends', desc: 'Discover & share food spots' },
  { emoji: '🏃', name: 'Running Club', desc: 'Track runs & plan routes' },
  { emoji: '📚', name: 'Book Club', desc: 'Read & discuss together' },
  { emoji: '🎮', name: 'Gaming Squad', desc: 'Organize game nights' },
];

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { circles } = useCircles();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleJoinWithCode = useCallback(() => {
    setJoinError(null);
    setJoinSuccess(null);
    if (!joinCode.trim()) {
      setJoinError('Please enter an invite code');
      return;
    }
    if (joinCode.trim().length < 3) {
      setJoinError('Code must be at least 3 characters');
      return;
    }
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const found = circles.find(c => c.inviteCode.toLowerCase() === joinCode.trim().toLowerCase());
    if (found) {
      setJoinSuccess(`You're already in ${found.name}`);
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } else {
      setJoinError('No group found with that code. Check and try again.');
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    setTimeout(() => {
      setJoinError(null);
      setJoinSuccess(null);
    }, 4000);
    setJoinCode('');
  }, [joinCode, circles]);

  const handleTemplatePress = useCallback((_templateName: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/create-circle');
  }, [router]);

  const filteredSuggestions = SUGGESTED_CIRCLES.filter(s =>
    s.name.toLowerCase().includes(searchText.toLowerCase()) ||
    s.desc.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Groups</Text>
          <TouchableOpacity style={styles.searchIconBtn}>
            <Search size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.searchBar}>
            <Search size={18} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search group templates..."
              placeholderTextColor={colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
              accessibilityLabel="Search group templates"
            />
          </View>

          <View style={styles.joinSection}>
            <Text style={styles.sectionTitle}>Join with invite code</Text>
            <View style={styles.joinRow}>
              <View style={styles.joinInputContainer}>
                <Hash size={16} color={colors.textTertiary} />
                <TextInput
                  style={styles.joinInput}
                  placeholder="Enter code..."
                  placeholderTextColor={colors.textTertiary}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  accessibilityLabel="Enter invite code"
                />
              </View>
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={handleJoinWithCode}
                accessibilityLabel="Join group with code"
                accessibilityRole="button"
              >
                <ArrowRight size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
            {joinError && (
              <Text style={styles.joinErrorText}>{joinError}</Text>
            )}
            {joinSuccess && (
              <Text style={styles.joinSuccessText}>{joinSuccess}</Text>
            )}
          </View>

          <View style={styles.createSection}>
            <TouchableOpacity
              style={styles.createCard}
              onPress={() => router.push('/create-circle')}
              accessibilityLabel="Create a new group"
              accessibilityRole="button"
            >
              <View style={styles.createIconContainer}>
                <Plus size={24} color={colors.primary} />
              </View>
              <View style={styles.createTextContainer}>
                <Text style={styles.createTitle}>Create a new group</Text>
                <Text style={styles.createDesc}>Start fresh with your own group</Text>
              </View>
              <ArrowRight size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.templatesSection}>
            <Text style={styles.sectionTitle}>Group templates</Text>
            <Text style={styles.sectionSubtitle}>Quick-start ideas for your groups</Text>
            <View style={styles.templateGrid}>
              {filteredSuggestions.map((suggestion, index) => {
                const cardBg = CARD_COLORS[index % CARD_COLORS.length];
                const cardText = CARD_TEXT_COLORS[index % CARD_TEXT_COLORS.length];
                return (
                  <TemplateCard
                    key={index}
                    suggestion={suggestion}
                    cardBg={cardBg}
                    cardText={cardText}
                    onPress={() => handleTemplatePress(suggestion.name)}
                  />
                );
              })}
            </View>

            {filteredSuggestions.length === 0 && searchText.length > 0 && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsEmoji}>🔍</Text>
                <Text style={styles.noResultsText}>No templates matching &ldquo;{searchText}&rdquo;</Text>
                <TouchableOpacity
                  style={styles.noResultsBtn}
                  onPress={() => router.push('/create-circle')}
                >
                  <Text style={styles.noResultsBtnText}>Create custom group</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function TemplateCard({ suggestion, cardBg, cardText, onPress }: {
  suggestion: { emoji: string; name: string; desc: string };
  cardBg: string;
  cardText: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], width: '48%' as any, marginBottom: 12 }]}>
      <TouchableOpacity
        style={[{
          backgroundColor: cardBg,
          borderRadius: 20,
          padding: 16,
          minHeight: 110,
        }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityLabel={`${suggestion.name}: ${suggestion.desc}`}
        accessibilityRole="button"
      >
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: 'rgba(0,0,0,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}>
          <Text style={{ fontSize: 18 }}>{suggestion.emoji}</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '700' as const, color: cardText, marginBottom: 2 }}>{suggestion.name}</Text>
        <Text style={{ fontSize: 11, color: cardText, opacity: 0.7 }}>{suggestion.desc}</Text>
      </TouchableOpacity>
    </Animated.View>
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
  searchIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  joinSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: -6,
    marginBottom: 12,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 8,
  },
  joinInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  joinInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 12,
  },
  joinBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(91,76,219,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  createTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  createDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  templatesSection: {
    paddingHorizontal: 20,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  noResultsBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  noResultsBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  joinErrorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500' as const,
    marginTop: 8,
    marginLeft: 4,
  },
  joinSuccessText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500' as const,
    marginTop: 8,
    marginLeft: 4,
  },
});
