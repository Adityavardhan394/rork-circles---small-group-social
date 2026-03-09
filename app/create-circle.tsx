import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';
import { CIRCLE_EMOJIS, CIRCLE_COLORS } from '@/mocks/data';
import { Circle } from '@/types';

export default function CreateCircleScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏠');
  const [selectedColor, setSelectedColor] = useState(CIRCLE_COLORS[0]);
  const router = useRouter();
  const { addCircle } = useCircles();
  const { user } = useUser();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleCreate = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your huddle a name!');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const inviteCode = name.trim().toUpperCase().replace(/\s+/g, '').slice(0, 6) + Math.floor(Math.random() * 100);
    const newCircle: Circle = {
      id: `circle-${Date.now()}`,
      name: name.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
      members: user ? [user] : [],
      admins: user ? [user.id] : [],
      inviteCode,
      createdAt: new Date().toISOString(),
      lastActivity: 'Just created',
      description: description.trim() || undefined,
    };
    addCircle(newCircle);
    router.back();
  }, [name, description, selectedEmoji, selectedColor, addCircle, user, router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Huddle</Text>
          <TouchableOpacity
            style={[styles.createBtn, !name.trim() && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!name.trim()}
          >
            <Text style={[styles.createBtnText, !name.trim() && styles.createBtnTextDisabled]}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewContainer}>
            <View style={[styles.previewCircle, { backgroundColor: selectedColor + '20' }]}>
              <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
            </View>
            <Text style={styles.previewName}>{name || 'Huddle Name'}</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Huddle name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flatmates, Gym Squad..."
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={30}
              autoFocus
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's this huddle about?"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              maxLength={100}
              multiline
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Pick an emoji</Text>
            <View style={styles.emojiGrid}>
              {CIRCLE_EMOJIS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiBtn, selectedEmoji === emoji && styles.emojiBtnSelected]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Pick a color</Text>
            <View style={styles.colorGrid}>
              {CIRCLE_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorBtn,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorBtnSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createBtnDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  createBtnTextDisabled: {
    color: colors.textTertiary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  previewCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewEmoji: {
    fontSize: 36,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.teal50,
    borderWidth: 2,
  },
  emojiText: {
    fontSize: 22,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorBtnSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
});
