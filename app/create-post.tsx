import React, { useState, useCallback } from 'react';
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
import Colors from '@/constants/colors';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';
import { CURRENT_USER } from '@/mocks/data';
import { Post } from '@/types';
import CirclePicker from '@/components/CirclePicker';

export default function CreatePostScreen() {
  const { circleId: paramCircleId } = useLocalSearchParams<{ circleId: string }>();
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(paramCircleId ?? null);
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [step, setStep] = useState<'pick' | 'compose'>(paramCircleId ? 'compose' : 'pick');
  const router = useRouter();
  const { circles, addPost, getCircleById } = useCircles();
  const { user } = useUser();

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const now = new Date();
    const expires = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      circleId: selectedCircleId,
      author: user ?? CURRENT_USER,
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
  }, [text, imageUri, selectedCircleId, addPost, user, router]);

  const handleSelectCircle = useCallback((id: string) => {
    setSelectedCircleId(id);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedCircleId) {
      Alert.alert('Select a huddle', 'Pick a huddle to continue.');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setStep('compose');
  }, [selectedCircleId]);

  if (step === 'pick') {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Post</Text>
            <TouchableOpacity
              style={[styles.nextBtn, !selectedCircleId && styles.nextBtnDisabled]}
              onPress={handleContinue}
              disabled={!selectedCircleId}
            >
              <Text style={[styles.nextBtnText, !selectedCircleId && styles.nextBtnTextDisabled]}>Next</Text>
              <ArrowRight size={16} color={!selectedCircleId ? Colors.textTertiary : Colors.white} />
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
            <X size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {circle ? `Post to ${circle.emoji} ${circle.name}` : 'New Post'}
          </Text>
          <TouchableOpacity
            style={[styles.postBtn, (!text.trim() && !imageUri) && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={!text.trim() && !imageUri}
          >
            <Send size={16} color={(!text.trim() && !imageUri) ? Colors.textTertiary : Colors.white} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.authorRow}>
            <Image
              source={{ uri: user?.avatar || CURRENT_USER.avatar }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.authorName}>{user?.name || CURRENT_USER.name}</Text>
              <Text style={styles.expiryNote}>Expires in 72 hours</Text>
            </View>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.textTertiary}
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
                <X size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={handlePickImage}>
              <ImageIcon size={22} color={Colors.primary} />
              <Text style={styles.toolbarText}>Photo</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.surfaceSecondary,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  nextBtnTextDisabled: {
    color: Colors.textTertiary,
  },
  postBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnDisabled: {
    backgroundColor: Colors.surfaceSecondary,
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
    color: Colors.text,
  },
  expiryNote: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: Colors.text,
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
    borderTopColor: Colors.borderLight,
    gap: 16,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.teal50,
  },
  toolbarText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
});
