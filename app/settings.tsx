import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
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
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  Lock,
  UserX,
  Flag,
  LogOut,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/providers/UserProvider';
import { useCircles } from '@/providers/CirclesProvider';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { ThemeMode } from '@/types';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useUser();
  const { resetAllData } = useCircles();
  const { themeMode, setTheme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  }, [fadeAnim]);

  const handleToggle = useCallback((setter: (v: boolean) => void, newValue: boolean) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(newValue);
  }, []);

  const handleThemeChange = useCallback((mode: ThemeMode) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    void setTheme(mode);
  }, [setTheme]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all your groups, posts, and data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your data will be permanently removed.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Request Submitted', 'Your account deletion request has been submitted. It will be processed within 48 hours.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, []);

  const handleExportData = useCallback(() => {
    Alert.alert(
      'Export Your Data',
      'We\'ll prepare a download of all your data including posts, media, and group information.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: () => {
            Alert.alert('Export Requested', 'Your data export is being prepared. This may take a few minutes.');
          },
        },
      ]
    );
  }, []);

  const handleBlockedUsers = useCallback(() => {
    Alert.alert('Blocked Users', 'You haven\'t blocked anyone yet.');
  }, []);

  const handleCommunityGuidelines = useCallback(() => {
    Alert.alert(
      'Community Guidelines',
      'Huddle is built for real-life groups. We expect all members to:\n\n' +
      '1. Be respectful to all group members\n' +
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
      '- Group membership information\n\n' +
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
      '- Respect intellectual property rights\n\n' +
      'We reserve the right to suspend accounts that violate these terms.',
      [{ text: 'Close' }]
    );
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appearance</Text>
              <View style={styles.sectionCard}>
                <View style={styles.themeRow}>
                  <View style={[styles.settingIcon, { backgroundColor: 'rgba(91,76,219,0.15)' }]}>
                    <Moon size={17} color="#7B6FE8" />
                  </View>
                  <Text style={styles.themeLabel}>Theme</Text>
                </View>
                <View style={styles.themeOptions}>
                  {([
                    { mode: 'light' as ThemeMode, label: 'Light', icon: Sun, color: '#F59E0B' },
                    { mode: 'dark' as ThemeMode, label: 'Dark', icon: Moon, color: '#7B6FE8' },
                    { mode: 'system' as ThemeMode, label: 'System', icon: Smartphone, color: '#3B82F6' },
                  ]).map(opt => (
                    <TouchableOpacity
                      key={opt.mode}
                      style={[styles.themeOption, themeMode === opt.mode && styles.themeOptionActive]}
                      onPress={() => handleThemeChange(opt.mode)}
                    >
                      <opt.icon size={16} color={themeMode === opt.mode ? colors.primary : colors.textTertiary} />
                      <Text style={[styles.themeOptionText, themeMode === opt.mode && styles.themeOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.sectionCard}>
                <SettingRow icon={Bell} iconColor="#3B82F6" label="New posts" description="When someone posts in your groups" value={notifNewPost} onToggle={(v) => handleToggle(setNotifNewPost, v)} />
                <View style={styles.divider} />
                <SettingRow icon={Bell} iconColor="#7B6FE8" label="Polls" description="When a new poll is created" value={notifPolls} onToggle={(v) => handleToggle(setNotifPolls, v)} />
                <View style={styles.divider} />
                <SettingRow icon={Bell} iconColor="#10B981" label="Events & reminders" description="Event invites and upcoming reminders" value={notifEvents} onToggle={(v) => handleToggle(setNotifEvents, v)} />
                <View style={styles.divider} />
                <SettingRow icon={BellOff} iconColor="#F59E0B" label="Reactions" description="When someone reacts to your posts" value={notifReactions} onToggle={(v) => handleToggle(setNotifReactions, v)} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Privacy</Text>
              <View style={styles.sectionCard}>
                <SettingRow icon={Eye} iconColor="#10B981" label="Online status" description="Show when you're active" value={showOnlineStatus} onToggle={(v) => handleToggle(setShowOnlineStatus, v)} />
                <View style={styles.divider} />
                <SettingRow icon={EyeOff} iconColor="#3B82F6" label="Read receipts" description="Let others know you've seen their posts" value={showReadReceipts} onToggle={(v) => handleToggle(setShowReadReceipts, v)} />
                <View style={styles.divider} />
                <SettingRow icon={Lock} iconColor="#7B6FE8" label="Ephemeral by default" description="Posts auto-expire after 72 hours" value={ephemeralDefault} onToggle={(v) => handleToggle(setEphemeralDefault, v)} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Safety</Text>
              <View style={styles.sectionCard}>
                <ActionRow icon={UserX} iconColor="#EF4444" label="Blocked users" onPress={handleBlockedUsers} />
                <View style={styles.divider} />
                <ActionRow icon={Flag} iconColor="#F59E0B" label="Community guidelines" onPress={handleCommunityGuidelines} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Legal</Text>
              <View style={styles.sectionCard}>
                <ActionRow icon={Shield} iconColor="#10B981" label="Privacy policy" onPress={handlePrivacyPolicy} />
                <View style={styles.divider} />
                <ActionRow icon={FileText} iconColor="#3B82F6" label="Terms of service" onPress={handleTerms} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Data</Text>
              <View style={styles.sectionCard}>
                <ActionRow icon={Download} iconColor="#5B4CDB" label="Export your data" onPress={handleExportData} />
                <View style={styles.divider} />
                <ActionRow icon={Trash2} iconColor="#EF4444" label="Delete account" onPress={handleDeleteAccount} danger />
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
                            void resetAllData();
                            logout();
                            router.replace('/onboarding');
                          },
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.settingIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                    <LogOut size={17} color="#EF4444" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingLabel, styles.dangerText]}>Log out</Text>
                  </View>
                  <ChevronRight size={16} color={colors.textTertiary} />
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
  icon: Icon, iconColor, label, description, value, onToggle,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '15' }]}>
        <Icon size={17} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.stone300, true: colors.primaryLight }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function ActionRow({
  icon: Icon, iconColor, label, onPress, danger = false,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '15' }]}>
        <Icon size={17} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, danger && styles.dangerText]}>{label}</Text>
      </View>
      <ChevronRight size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 17, fontWeight: '600' as const, color: colors.text, textAlign: 'center',
  },
  headerSpacer: { width: 42 },
  scrollContent: { paddingBottom: 40 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary,
    textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8, marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 60 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingIcon: {
    width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  settingContent: { flex: 1, marginLeft: 12 },
  settingLabel: { fontSize: 15, fontWeight: '500' as const, color: colors.text },
  settingDesc: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
  dangerText: { color: colors.danger },
  themeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8 },
  themeLabel: { fontSize: 15, fontWeight: '500' as const, color: colors.text, marginLeft: 12 },
  themeOptions: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14,
  },
  themeOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 14, backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  themeOptionActive: {
    backgroundColor: 'rgba(91,76,219,0.15)', borderColor: colors.primary,
  },
  themeOptionText: { fontSize: 13, fontWeight: '500' as const, color: colors.textTertiary },
  themeOptionTextActive: { color: colors.primary, fontWeight: '600' as const },
  aboutSection: { alignItems: 'center', paddingVertical: 32 },
  aboutText: { fontSize: 13, fontWeight: '600' as const, color: colors.textTertiary },
  aboutSubtext: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
});
