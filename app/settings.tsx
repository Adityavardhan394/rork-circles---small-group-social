import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Download,
  FileText,
  MessageSquareWarning,
  ChevronRight,
  Moon,
  Globe,
  Info,
  Lock,
  UserX,
  Flag,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useUser } from '@/providers/UserProvider';
import { LogOut } from 'lucide-react-native';

interface SettingToggle {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  value: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [notifNewPost, setNotifNewPost] = useState(true);
  const [notifPolls, setNotifPolls] = useState(true);
  const [notifEvents, setNotifEvents] = useState(true);
  const [notifReactions, setNotifReactions] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [ephemeralDefault, setEphemeralDefault] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleToggle = useCallback((setter: (v: boolean) => void, newValue: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(newValue);
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all your huddles, posts, and data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Type your name to confirm deletion. All your data will be permanently removed.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: () => {
                    console.log('Account deletion requested for user:', user?.id);
                    Alert.alert('Request Submitted', 'Your account deletion request has been submitted. It will be processed within 48 hours.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [user]);

  const handleExportData = useCallback(() => {
    Alert.alert(
      'Export Your Data',
      'We\'ll prepare a download of all your data including posts, media, and huddle information. You\'ll receive a notification when it\'s ready.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: () => {
            console.log('Data export requested for user:', user?.id);
            Alert.alert('Export Requested', 'Your data export is being prepared. This may take a few minutes.');
          },
        },
      ]
    );
  }, [user]);

  const handleBlockedUsers = useCallback(() => {
    Alert.alert('Blocked Users', 'You haven\'t blocked anyone yet.');
  }, []);

  const handleCommunityGuidelines = useCallback(() => {
    Alert.alert(
      'Community Guidelines',
      'Huddle is built for real-life groups. We expect all members to:\n\n' +
      '1. Be respectful to all huddle members\n' +
      '2. Not share explicit or harmful content\n' +
      '3. Not harass, bully, or threaten others\n' +
      '4. Not share others\' personal information\n' +
      '5. Report any violations you encounter\n\n' +
      'Violations may result in account suspension or removal.',
      [{ text: 'Got it' }]
    );
  }, []);

  const handlePrivacyPolicy = useCallback(() => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy matters to us.\n\n' +
      'Data We Collect:\n' +
      '- Name and profile photo\n' +
      '- Posts, polls, and events you create\n' +
      '- Huddle membership information\n\n' +
      'How We Use It:\n' +
      '- To provide the Huddle experience\n' +
      '- To send relevant notifications\n' +
      '- To improve our service\n\n' +
      'We never sell your data to third parties.\n' +
      'You can export or delete your data at any time.',
      [{ text: 'Close' }]
    );
  }, []);

  const handleTerms = useCallback(() => {
    Alert.alert(
      'Terms of Service',
      'By using Huddle, you agree to:\n\n' +
      '- Follow our Community Guidelines\n' +
      '- Not use the app for illegal activities\n' +
      '- Be responsible for content you post\n' +
      '- Respect intellectual property rights\n' +
      '- Accept that we may moderate content\n\n' +
      'We reserve the right to suspend accounts that violate these terms.',
      [{ text: 'Close' }]
    );
  }, []);

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
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.sectionCard}>
                <SettingRow
                  icon={Bell}
                  iconColor="#2563EB"
                  label="New posts"
                  description="When someone posts in your huddles"
                  value={notifNewPost}
                  onToggle={(v) => handleToggle(setNotifNewPost, v)}
                />
                <View style={styles.divider} />
                <SettingRow
                  icon={Bell}
                  iconColor="#7C3AED"
                  label="Polls"
                  description="When a new poll is created"
                  value={notifPolls}
                  onToggle={(v) => handleToggle(setNotifPolls, v)}
                />
                <View style={styles.divider} />
                <SettingRow
                  icon={Bell}
                  iconColor="#059669"
                  label="Events & reminders"
                  description="Event invites and upcoming reminders"
                  value={notifEvents}
                  onToggle={(v) => handleToggle(setNotifEvents, v)}
                />
                <View style={styles.divider} />
                <SettingRow
                  icon={BellOff}
                  iconColor="#D97706"
                  label="Reactions"
                  description="When someone reacts to your posts"
                  value={notifReactions}
                  onToggle={(v) => handleToggle(setNotifReactions, v)}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Privacy</Text>
              <View style={styles.sectionCard}>
                <SettingRow
                  icon={Eye}
                  iconColor="#059669"
                  label="Online status"
                  description="Show when you're active"
                  value={showOnlineStatus}
                  onToggle={(v) => handleToggle(setShowOnlineStatus, v)}
                />
                <View style={styles.divider} />
                <SettingRow
                  icon={EyeOff}
                  iconColor="#2563EB"
                  label="Read receipts"
                  description="Let others know you've seen their posts"
                  value={showReadReceipts}
                  onToggle={(v) => handleToggle(setShowReadReceipts, v)}
                />
                <View style={styles.divider} />
                <SettingRow
                  icon={Lock}
                  iconColor="#7C3AED"
                  label="Ephemeral by default"
                  description="Posts auto-expire after 72 hours"
                  value={ephemeralDefault}
                  onToggle={(v) => handleToggle(setEphemeralDefault, v)}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Safety</Text>
              <View style={styles.sectionCard}>
                <ActionRow
                  icon={UserX}
                  iconColor="#EF4444"
                  label="Blocked users"
                  onPress={handleBlockedUsers}
                />
                <View style={styles.divider} />
                <ActionRow
                  icon={Flag}
                  iconColor="#D97706"
                  label="Community guidelines"
                  onPress={handleCommunityGuidelines}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Legal</Text>
              <View style={styles.sectionCard}>
                <ActionRow
                  icon={Shield}
                  iconColor="#059669"
                  label="Privacy policy"
                  onPress={handlePrivacyPolicy}
                />
                <View style={styles.divider} />
                <ActionRow
                  icon={FileText}
                  iconColor="#2563EB"
                  label="Terms of service"
                  onPress={handleTerms}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Data</Text>
              <View style={styles.sectionCard}>
                <ActionRow
                  icon={Download}
                  iconColor="#0F766E"
                  label="Export your data"
                  onPress={handleExportData}
                />
                <View style={styles.divider} />
                <ActionRow
                  icon={Trash2}
                  iconColor="#EF4444"
                  label="Delete account"
                  onPress={handleDeleteAccount}
                  danger
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => {
                    Alert.alert(
                      'Log out',
                      'Are you sure you want to log out?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Log out',
                          style: 'destructive',
                          onPress: () => {
                            logout();
                            router.replace('/onboarding');
                          },
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Log out"
                  accessibilityRole="button"
                >
                  <View style={[styles.settingIcon, { backgroundColor: '#EF444412' }]}>
                    <LogOut size={17} color="#EF4444" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingLabel, styles.dangerText]}>Log out</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutText}>Huddle v1.0.0</Text>
              <Text style={styles.aboutSubtext}>Made with care in Hyderabad</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SettingRow({
  icon: Icon,
  iconColor,
  label,
  description,
  value,
  onToggle,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '12' }]}>
        <Icon size={17} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.stone300, true: Colors.primaryLight }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

function ActionRow({
  icon: Icon,
  iconColor,
  label,
  onPress,
  danger = false,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '12' }]}>
        <Icon size={17} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, danger && styles.dangerText]}>{label}</Text>
      </View>
      <ChevronRight size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 60,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  settingDesc: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  dangerText: {
    color: Colors.danger,
  },
  aboutSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  aboutText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },
  aboutSubtext: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});
