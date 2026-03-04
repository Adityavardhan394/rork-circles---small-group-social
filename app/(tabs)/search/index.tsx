import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Hash, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Colors from '@/constants/colors';
import { useCircles } from '@/providers/CirclesProvider';

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
  const router = useRouter();
  const { circles } = useCircles();

  const handleJoinWithCode = useCallback(() => {
    if (!joinCode.trim()) {
      Alert.alert('Enter a code', 'Please enter an invite code to join a huddle.');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const found = circles.find(c => c.inviteCode.toLowerCase() === joinCode.trim().toLowerCase());
    if (found) {
      Alert.alert('Already a member!', `You're already in ${found.name}`);
    } else {
      Alert.alert('Huddle not found', 'No huddle found with that invite code. Check the code and try again.');
    }
    setJoinCode('');
  }, [joinCode, circles]);

  const handleTemplatePress = useCallback((templateName: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          <Text style={styles.title} accessibilityRole="header">Discover</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.searchBar}>
            <Search size={18} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search huddle templates..."
              placeholderTextColor={Colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
              accessibilityLabel="Search huddle templates"
            />
          </View>

          <View style={styles.joinSection}>
            <Text style={styles.sectionTitle}>Join with invite code</Text>
            <View style={styles.joinRow}>
              <View style={styles.joinInputContainer}>
                <Hash size={16} color={Colors.textTertiary} />
                <TextInput
                  style={styles.joinInput}
                  placeholder="Enter code..."
                  placeholderTextColor={Colors.textTertiary}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  accessibilityLabel="Enter invite code"
                />
              </View>
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={handleJoinWithCode}
                accessibilityLabel="Join huddle with code"
                accessibilityRole="button"
              >
                <ArrowRight size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.createSection}>
            <TouchableOpacity
              style={styles.createCard}
              onPress={() => router.push('/create-circle')}
              accessibilityLabel="Create a new huddle"
              accessibilityRole="button"
            >
              <View style={styles.createIconContainer}>
                <Plus size={24} color={Colors.primary} />
              </View>
              <View style={styles.createTextContainer}>
                <Text style={styles.createTitle}>Create a new huddle</Text>
                <Text style={styles.createDesc}>Start fresh with your own group</Text>
              </View>
              <ArrowRight size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.templatesSection}>
            <Text style={styles.sectionTitle}>Huddle templates</Text>
            <Text style={styles.sectionSubtitle}>Quick-start ideas for your huddles</Text>
            {filteredSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.templateCard}
                onPress={() => handleTemplatePress(suggestion.name)}
                activeOpacity={0.7}
                accessibilityLabel={`${suggestion.name}: ${suggestion.desc}`}
                accessibilityRole="button"
              >
                <View style={styles.templateEmoji}>
                  <Text style={styles.templateEmojiText}>{suggestion.emoji}</Text>
                </View>
                <View style={styles.templateContent}>
                  <Text style={styles.templateName}>{suggestion.name}</Text>
                  <Text style={styles.templateDesc}>{suggestion.desc}</Text>
                </View>
                <ArrowRight size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            ))}

            {filteredSuggestions.length === 0 && searchText.length > 0 && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsEmoji}>🔍</Text>
                <Text style={styles.noResultsText}>No templates matching "{searchText}"</Text>
                <TouchableOpacity
                  style={styles.noResultsBtn}
                  onPress={() => router.push('/create-circle')}
                >
                  <Text style={styles.noResultsBtnText}>Create custom huddle</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  scrollContent: {
    paddingBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  joinSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
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
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
  },
  joinInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
  },
  joinBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.teal50,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.teal100,
  },
  createIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
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
    color: Colors.text,
  },
  createDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  templatesSection: {
    paddingHorizontal: 20,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  templateEmoji: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateEmojiText: {
    fontSize: 20,
  },
  templateContent: {
    flex: 1,
    marginLeft: 12,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  templateDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
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
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  noResultsBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  noResultsBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
