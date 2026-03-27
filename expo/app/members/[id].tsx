import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { X, Crown, Copy, Share2, UserPlus, MoreHorizontal, Flag, UserX } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useCircles } from '@/providers/CirclesProvider';
import ActionSheet, { ActionSheetOption } from '@/components/ActionSheet';

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCircleById } = useCircles();
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const circle = getCircleById(id ?? '');

  const handleCopyCode = useCallback(async () => {
    if (!circle) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Invite Code', `Share this code: ${circle.inviteCode}\n\nAnyone can join with this code!`);
  }, [circle]);

  const handleShare = useCallback(async () => {
    if (!circle) return;
    try {
      await Share.share({
        message: `Join my huddle "${circle.name}" on Huddle! Use invite code: ${circle.inviteCode}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  }, [circle]);

  const handleMemberOptions = useCallback((memberName: string) => {
    setSelectedMemberName(memberName);
    setActionSheetVisible(true);
  }, []);

  const handleReportMember = useCallback(() => {
    Alert.alert(
      `Report ${selectedMemberName}?`,
      'Select a reason for reporting this member.',
      [
        { text: 'Spam', onPress: () => Alert.alert('Reported', 'Thank you for reporting. We\'ll review this.') },
        { text: 'Inappropriate behavior', onPress: () => Alert.alert('Reported', 'Thank you for reporting. We\'ll review this.') },
        { text: 'Harassment', onPress: () => Alert.alert('Reported', 'Thank you for reporting. We\'ll review this.') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [selectedMemberName]);

  const handleBlockMember = useCallback(() => {
    Alert.alert(
      `Block ${selectedMemberName}?`,
      `You won't see posts from ${selectedMemberName} anymore. They won't be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            console.log(`Blocked ${selectedMemberName}`);
            Alert.alert('Blocked', `${selectedMemberName} has been blocked.`);
          },
        },
      ]
    );
  }, [selectedMemberName]);

  const memberActionOptions: ActionSheetOption[] = [
    {
      label: `Report ${selectedMemberName}`,
      icon: <Flag size={18} color={colors.warning} />,
      onPress: handleReportMember,
    },
    {
      label: `Block ${selectedMemberName}`,
      icon: <UserX size={18} color={colors.danger} />,
      onPress: handleBlockMember,
      destructive: true,
    },
  ];

  if (!circle) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
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
            onPress={() => router.back()}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">Members</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.inviteSection}>
            <Text style={styles.sectionTitle}>Invite to huddle</Text>
            <View style={styles.inviteCard}>
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Invite code</Text>
                <Text style={styles.code} accessibilityLabel={`Invite code: ${circle.inviteCode}`}>{circle.inviteCode}</Text>
              </View>
              <View style={styles.inviteActions}>
                <TouchableOpacity
                  style={styles.inviteActionBtn}
                  onPress={handleCopyCode}
                  accessibilityLabel="Copy invite code"
                  accessibilityRole="button"
                >
                  <Copy size={18} color={colors.primary} />
                  <Text style={styles.inviteActionText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inviteActionBtn}
                  onPress={handleShare}
                  accessibilityLabel="Share invite link"
                  accessibilityRole="button"
                >
                  <Share2 size={18} color={colors.primary} />
                  <Text style={styles.inviteActionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>
              {circle.members.length} member{circle.members.length !== 1 ? 's' : ''}
            </Text>
            {circle.members.map(member => {
              const isAdmin = circle.admins.includes(member.id);
              return (
                <View
                  key={member.id}
                  style={styles.memberRow}
                  accessibilityLabel={`${member.name}${isAdmin ? ', Admin' : ''}`}
                >
                  <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {isAdmin && (
                      <View style={styles.adminBadge}>
                        <Crown size={10} color={colors.accent} />
                        <Text style={styles.adminText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.memberMoreBtn}
                    onPress={() => handleMemberOptions(member.name)}
                    accessibilityLabel={`Options for ${member.name}`}
                    accessibilityRole="button"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MoreHorizontal size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.addMemberBtn}
            onPress={handleShare}
            accessibilityLabel="Invite more people"
            accessibilityRole="button"
          >
            <UserPlus size={20} color={colors.primary} />
            <Text style={styles.addMemberText}>Invite more people</Text>
          </TouchableOpacity>
        </ScrollView>

        <ActionSheet
          visible={actionSheetVisible}
          onClose={() => setActionSheetVisible(false)}
          title={`Options for ${selectedMemberName}`}
          options={memberActionOptions}
        />
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
  headerRight: {
    width: 36,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inviteSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inviteCard: {
    backgroundColor: colors.teal50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.teal100,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  codeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  code: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.primaryDark,
    letterSpacing: 3,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  inviteActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderRadius: 10,
  },
  inviteActionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  membersSection: {
    marginBottom: 24,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 14,
    marginBottom: 6,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  adminText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.accent,
  },
  memberMoreBtn: {
    padding: 6,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addMemberText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
});
