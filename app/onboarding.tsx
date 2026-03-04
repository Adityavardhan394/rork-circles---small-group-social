import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowRight, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useUser } from '@/providers/UserProvider';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
];

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const { completeOnboarding } = useUser();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCustomAvatar(result.assets[0].uri);
      setSelectedAvatar(result.assets[0].uri);
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Name required', 'What should we call you?');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    completeOnboarding(name.trim(), customAvatar || selectedAvatar);
    router.replace('/');
  }, [name, selectedAvatar, customAvatar, completeOnboarding, router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.hero}>
            <Text style={styles.appIcon}>⭕</Text>
            <Text style={styles.title}>Welcome to Huddle</Text>
            <Text style={styles.subtitle}>
              For your real groups.{'\n'}Plans, memories, and chaos — all in one huddle.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>What's your name?</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoFocus
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Pick an avatar</Text>
            <View style={styles.avatarGrid}>
              <TouchableOpacity style={styles.cameraBtn} onPress={handlePickImage}>
                <Camera size={22} color={Colors.primary} />
              </TouchableOpacity>
              {AVATAR_OPTIONS.map((avatar, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.avatarOption, selectedAvatar === avatar && !customAvatar && styles.avatarOptionSelected]}
                  onPress={() => { setSelectedAvatar(avatar); setCustomAvatar(null); }}
                >
                  <Image source={{ uri: avatar }} style={styles.avatarImage} />
                </TouchableOpacity>
              ))}
              {customAvatar && (
                <View style={[styles.avatarOption, styles.avatarOptionSelected]}>
                  <Image source={{ uri: customAvatar }} style={styles.avatarImage} />
                </View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.continueBtn, !name.trim() && styles.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={!name.trim()}
              activeOpacity={0.8}
            >
              <Text style={[styles.continueBtnText, !name.trim() && styles.continueBtnTextDisabled]}>
                Get Started
              </Text>
              <ArrowRight size={18} color={!name.trim() ? Colors.textTertiary : Colors.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  formSection: {
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  nameInput: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    color: Colors.text,
    fontWeight: '500' as const,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  cameraBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.teal50,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOption: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: Colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    marginTop: 16,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnDisabled: {
    backgroundColor: Colors.surfaceSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  continueBtnTextDisabled: {
    color: Colors.textTertiary,
  },
});
