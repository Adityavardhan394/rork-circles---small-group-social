import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Settings, ChevronRight, Shield, Bell, CircleHelp, LogOut, Edit3, X, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useUser } from '@/providers/UserProvider';
import { useCircles } from '@/providers/CirclesProvider';

const MENU_ITEMS = [
  { icon: Settings, label: 'Settings', color: '#0F766E', route: '/settings' },
  { icon: Bell, label: 'Notifications', color: '#2563EB', route: null },
  { icon: Shield, label: 'Privacy & Safety', color: '#059669', route: '/settings' },
  { icon: CircleHelp, label: 'Help & Support', color: '#D97706', route: null },
];

export default function ProfileScreen() {
  const { user, logout, updateUser } = useUser();
  const { circles } = useCircles();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editBio, setEditBio] = useState(user?.bio ?? '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar ?? '');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => {
          logout();
          router.replace('/onboarding');
        }},
      ]
    );
  }, []);

  const handleMenuPress = useCallback((route: string | null, label: string) => {
    if (route) {
      router.push(route as any);
    } else {
      Alert.alert(label, 'This feature is coming soon!');
    }
  }, [router]);

  const handleOpenEditModal = useCallback(() => {
    setEditName(user?.name ?? '');
    setEditBio(user?.bio ?? '');
    setEditAvatar(user?.avatar ?? '');
    setShowEditModal(true);
  }, [user]);

  const handlePickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setEditAvatar(result.assets[0].uri);
    }
  }, []);

  const handleSaveProfile = useCallback(() => {
    if (!editName.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    if (!user) return;
    updateUser({
      ...user,
      name: editName.trim(),
      bio: editBio.trim() || undefined,
      avatar: editAvatar,
    });
    setShowEditModal(false);
  }, [editName, editBio, editAvatar, user, updateUser]);

  const connectionCount = new Set(circles.flatMap(c => c.members.map(m => m.id))).size;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Profile</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <Settings size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' }}
                  style={styles.avatar}
                  accessibilityLabel="Profile photo"
                />
                <TouchableOpacity
                  style={styles.editAvatarBtn}
                  onPress={handleOpenEditModal}
                  accessibilityLabel="Edit profile"
                  accessibilityRole="button"
                >
                  <Edit3 size={12} color={Colors.white} />
                </TouchableOpacity>
              </View>
              <Text style={styles.name}>{user?.name || 'Your Name'}</Text>
              {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : (
                <TouchableOpacity onPress={handleOpenEditModal}>
                  <Text style={styles.addBioText}>+ Add a bio</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEditModal}>
                <Edit3 size={14} color={Colors.primary} />
                <Text style={styles.editProfileBtnText}>Edit Profile</Text>
              </TouchableOpacity>
              <View style={styles.statsRow}>
                <View style={styles.stat} accessibilityLabel={`${circles.length} circles`}>
                  <Text style={styles.statValue}>{circles.length}</Text>
                  <Text style={styles.statLabel}>Huddles</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat} accessibilityLabel={`${connectionCount} connections`}>
                  <Text style={styles.statValue}>{connectionCount}</Text>
                  <Text style={styles.statLabel}>Connections</Text>
                </View>
              </View>
            </View>

            <View style={styles.circlesSection}>
              <Text style={styles.sectionTitle}>Your Huddles</Text>
              {circles.map(circle => (
                <TouchableOpacity
                  key={circle.id}
                  style={styles.circleRow}
                  onPress={() => router.push(`/circle/${circle.id}`)}
                  activeOpacity={0.7}
                  accessibilityLabel={`${circle.name}, ${circle.members.length} members`}
                  accessibilityRole="button"
                >
                  <View style={[styles.circleEmoji, { backgroundColor: circle.color + '15' }]}>
                    <Text style={styles.circleEmojiText}>{circle.emoji}</Text>
                  </View>
                  <View style={styles.circleInfo}>
                    <Text style={styles.circleName}>{circle.name}</Text>
                    <Text style={styles.circleMemberCount}>{circle.members.length} members</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Quick access</Text>
              {MENU_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuRow}
                  activeOpacity={0.7}
                  onPress={() => handleMenuPress(item.route, item.label)}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '12' }]}>
                    <item.icon size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <ChevronRight size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              accessibilityLabel="Log out"
              accessibilityRole="button"
            >
              <LogOut size={18} color={Colors.danger} />
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Huddle v1.0.0</Text>
          </Animated.View>
        </ScrollView>

        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowEditModal(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <X size={22} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSaveProfile}>
                  <Text style={styles.saveBtn}>Save</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <TouchableOpacity style={styles.modalAvatarContainer} onPress={handlePickAvatar}>
                  <Image
                    source={{ uri: editAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' }}
                    style={styles.modalAvatar}
                  />
                  <View style={styles.modalAvatarOverlay}>
                    <Camera size={20} color={Colors.white} />
                  </View>
                </TouchableOpacity>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Your name"
                    placeholderTextColor={Colors.textTertiary}
                    maxLength={30}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bio</Text>
                  <TextInput
                    style={[styles.textInput, styles.bioInput]}
                    value={editBio}
                    onChangeText={setEditBio}
                    placeholder="Tell people about yourself..."
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                    maxLength={120}
                  />
                  <Text style={styles.charCount}>{editBio.length}/120</Text>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 28,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  name: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  bio: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  circlesSection: {
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
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 14,
    marginBottom: 6,
  },
  circleEmoji: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleEmojiText: {
    fontSize: 18,
  },
  circleInfo: {
    flex: 1,
    marginLeft: 10,
  },
  circleName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  circleMemberCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 6,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.danger + '20',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 20,
  },
  addBioText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.teal50,
    borderWidth: 1,
    borderColor: Colors.teal100,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  saveBtn: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  modalAvatarContainer: {
    position: 'relative' as const,
    marginBottom: 24,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 36,
  },
  modalAvatarOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'right' as const,
    marginTop: 4,
  },
});
