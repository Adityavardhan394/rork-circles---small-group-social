import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ImageIcon, Send, ArrowRight } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';

import { Post } from '@/types';
import CirclePicker from '@/components/CirclePicker';

const EXPIRY_OPTIONS = [
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '72h', hours: 72 },
  { label: '7d', hours: 168 },
  { label: 'Never', hours: 0 },
] as const;

export default function CreatePostScreen() {
  const { circleId: paramCircleId } = useLocalSearchParams<{ circleId: string }>();
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(paramCircleId ?? null);
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedExpiry, setSelectedExpiry] = useState<number>(72);
  const [step, setStep] = useState<'pick' | 'compose'>(paramCircleId ? 'compose' : 'pick');
  const router = useRouter();
  const { circles, addPost, getCircleById } = useCircles();
  const { user } = useUser();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const circle = getCircleById(selectedCircleId ?? '');

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handlePost = useCallback(() => {
    if (!selectedCircleId) {
      Alert.alert('Select a huddle', 'Choose which huddle to post to.');
      return;
    }
    if (!text.trim() && !imageUri) {
      Alert.alert('Empty post', 'Write something or add a photo!');
      return;
    }
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const now = new Date();
    const expires = selectedExpiry > 0
      ? new Date(now.getTime() + selectedExpiry * 60 * 60 * 1000)
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      circleId: selectedCircleId,
      author: user!,
      text: text.trim() || undefined,
      mediaUrls: imageUri ? [imageUri] : [],
      reactions: {},
      comments: [],
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      pinned: false,
    };
    addPost(newPost);
    router.back();
  }, [text, imageUri, selectedCircleId, selectedExpiry, addPost, user, router]);

  const handleSelectCircle = useCallback((id: string) => {
    setSelectedCircleId(id);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedCircleId) {
      Alert.alert('Select a huddle', 'Pick a huddle to continue.');
      return;
    }
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setStep('compose');
  }, [selectedCircleId]);

  if (step === 'pick') {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Post</Text>
            <TouchableOpacity
              style={[styles.nextBtn, !selectedCircleId && styles.nextBtnDisabled]}
              onPress={handleContinue}
              disabled={!selectedCircleId}
            >
              <Text style={[styles.nextBtnText, !selectedCircleId && styles.nextBtnTextDisabled]}>Next</Text>
              <ArrowRight size={16} color={!selectedCircleId ? colors.textTertiary : colors.white} />
            </TouchableOpacity>
          </View>
          <CirclePicker
            circles={circles}
            selectedCircleId={selectedCircleId}
            onSelect={handleSelectCircle}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => paramCircleId ? router.back() : setStep('pick')}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {circle ? `Post to ${circle.emoji} ${circle.name}` : 'New Post'}
          </Text>
          <TouchableOpacity
            style={[styles.postBtn, (!text.trim() && !imageUri) && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={!text.trim() && !imageUri}
          >
            <Send size={16} color={(!text.trim() && !imageUri) ? colors.textTertiary : colors.white} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.authorRow}>
            <Image
              source={{ uri: user?.avatar }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.authorName}>{user?.name ?? 'You'}</Text>
              <Text style={styles.expiryNote}>
                {selectedExpiry > 0 ? `Expires in ${selectedExpiry >= 168 ? '7 days' : `${selectedExpiry}h`}` : 'No expiry'}
              </Text>
            </View>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            textAlignVertical="top"
          />

          {imageUri && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
              <TouchableOpacity style={styles.removeImage} onPress={() => setImageUri(null)}>
                <X size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.expirySection}>
            <Text style={styles.expirySectionLabel}>Expires in</Text>
            <View style={styles.expiryOptionsRow}>
              {EXPIRY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.hours}
                  style={[
                    styles.expiryOption,
                    selectedExpiry === opt.hours && styles.expiryOptionActive,
                  ]}
                  onPress={() => setSelectedExpiry(opt.hours)}
                >
                  <Text
                    style={[
                      styles.expiryOptionText,
                      selectedExpiry === opt.hours && styles.expiryOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={handlePickImage}>
              <ImageIcon size={22} color={colors.primary} />
              <Text style={styles.toolbarText}>Photo</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  nextBtnDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  nextBtnTextDisabled: {
    color: colors.textTertiary,
  },
  postBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  expiryNote: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
    lineHeight: 24,
  },
  imagePreview: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 16,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(91,76,219,0.12)',
  },
  toolbarText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  expirySection: {
    marginBottom: 12,
  },
  expirySectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  expiryOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  expiryOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  expiryOptionActive: {
    backgroundColor: 'rgba(91,76,219,0.12)',
    borderColor: colors.primary,
  },
  expiryOptionText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  expiryOptionTextActive: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
});
