import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowRight, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useUser } from '@/providers/UserProvider';

const { width } = Dimensions.get('window');

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
];

const GROUP_AVATARS = [
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
];

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const { completeOnboarding } = useUser();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [fadeAnim, slideAnim, floatAnim]);

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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    completeOnboarding(name.trim(), customAvatar || selectedAvatar);
    router.replace('/');
  }, [name, selectedAvatar, customAvatar, completeOnboarding, router]);

  const btnScale = useRef(new Animated.Value(1)).current;
  const handleBtnPressIn = useCallback(() => {
    Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  }, [btnScale]);
  const handleBtnPressOut = useCallback(() => {
    Animated.spring(btnScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [btnScale]);

  return (
    <View style={styles.container}>
      <View style={styles.bgGlow1} />
      <View style={styles.bgGlow2} />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.hero}>
            <Animated.View style={[styles.groupAvatarsContainer, { transform: [{ translateY: floatAnim }] }]}>
              {GROUP_AVATARS.map((avatar, i) => (
                <View key={i} style={[styles.groupAvatarBubble, { marginLeft: i > 0 ? -12 : 0 }]}>
                  <Image source={{ uri: avatar }} style={styles.groupAvatarImg} />
                </View>
              ))}
              <View style={styles.groupIconBubble}>
                <Text style={styles.groupIconText}>👥</Text>
              </View>
            </Animated.View>

            <Text style={styles.heroTitle}>Group Broadcast</Text>
            <Text style={styles.heroSubtitle}>Alliance Network</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>What's your name?</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
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
                <Camera size={22} color={colors.primary} />
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
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.continueBtn, !name.trim() && styles.continueBtnDisabled]}
                onPress={handleContinue}
                onPressIn={handleBtnPressIn}
                onPressOut={handleBtnPressOut}
                disabled={!name.trim()}
                activeOpacity={1}
              >
                <Text style={[styles.continueBtnText, !name.trim() && styles.continueBtnTextDisabled]}>
                  Get Start
                </Text>
                <ArrowRight size={18} color={!name.trim() ? colors.textTertiary : colors.white} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientStart,
  },
  bgGlow1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(91, 76, 219, 0.15)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  bgGlow2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(123, 111, 232, 0.08)',
    bottom: width * 0.1,
    left: -width * 0.2,
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
  groupAvatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  groupAvatarBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.gradientStart,
    overflow: 'hidden',
  },
  groupAvatarImg: {
    width: '100%',
    height: '100%',
  },
  groupIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    borderWidth: 3,
    borderColor: colors.gradientStart,
  },
  groupIconText: {
    fontSize: 18,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.white,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  nameInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 20,
    padding: 16,
    fontSize: 18,
    color: colors.text,
    fontWeight: '500' as const,
    borderWidth: 1.5,
    borderColor: colors.border,
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
    borderRadius: 26,
    backgroundColor: 'rgba(91,76,219,0.15)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: colors.primary,
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
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  continueBtnDisabled: {
    backgroundColor: colors.surfaceSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.white,
  },
  continueBtnTextDisabled: {
    color: colors.textTertiary,
  },
});
