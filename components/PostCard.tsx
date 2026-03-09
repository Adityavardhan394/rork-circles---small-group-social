import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { MessageCircle, Pin, Clock, MoreHorizontal, Flag, UserX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { Post } from '@/types';
import ActionSheet, { ActionSheetOption } from '@/components/ActionSheet';

interface PostCardProps {
  post: Post;
  onReact: (emoji: string) => void;
  onPin: () => void;
  currentUserId: string;
}

const REACTION_EMOJIS = ['❤️', '😂', '🔥', '👍', '😮', '🙈', '😍', '👏', '💯', '😢', '🎉', '🤔'];

function PostCardComponent({ post, onReact, onPin, currentUserId }: PostCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showActions, setShowActions] = useState(false);

  const handleReact = useCallback((emoji: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onReact(emoji);
  }, [onReact]);

  const handleReport = useCallback(() => {
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        { text: 'Spam', onPress: () => Alert.alert('Reported', 'Thank you for reporting. We\'ll review this post.') },
        { text: 'Inappropriate', onPress: () => Alert.alert('Reported', 'Thank you for reporting. We\'ll review this post.') },
        { text: 'Harassment', onPress: () => Alert.alert('Reported', 'Thank you for reporting. We\'ll review this post.') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  const handleBlockUser = useCallback(() => {
    Alert.alert(
      `Block ${post.author.name}?`,
      `You won't see posts from ${post.author.name} anymore. They won't be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => Alert.alert('Blocked', `${post.author.name} has been blocked.`),
        },
      ]
    );
  }, [post.author.name]);

  const actionOptions: ActionSheetOption[] = [
    {
      label: post.pinned ? 'Unpin post' : 'Pin to board',
      icon: <Pin size={18} color={colors.primary} />,
      onPress: onPin,
    },
    {
      label: 'Report post',
      icon: <Flag size={18} color={colors.warning} />,
      onPress: handleReport,
    },
    {
      label: `Block ${post.author.name}`,
      icon: <UserX size={18} color={colors.danger} />,
      onPress: handleBlockUser,
      destructive: true,
    },
  ];

  const totalReactions = Object.values(post.reactions).reduce((sum, arr) => sum + arr.length, 0);
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <View style={styles.card} accessibilityLabel={`Post by ${post.author.name}`}>
      <View style={styles.header}>
        <Image source={{ uri: post.author.avatar }} style={styles.authorAvatar} accessibilityLabel={`${post.author.name}'s avatar`} />
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <View style={styles.timeRow}>
            <Clock size={11} color={colors.textTertiary} />
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
        </View>
        {post.pinned && (
          <TouchableOpacity
            style={styles.pinnedBadge}
            onPress={onPin}
            activeOpacity={0.7}
            accessibilityLabel="Unpin post"
            accessibilityRole="button"
          >
            <Pin size={11} color={colors.primary} />
            <Text style={styles.pinnedText}>Pinned</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={() => setShowActions(true)}
          accessibilityLabel="More options"
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreHorizontal size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View>
        {post.text ? <Text style={styles.postText}>{post.text}</Text> : null}
        {post.mediaUrls.length > 0 && (
          <Image source={{ uri: post.mediaUrls[0] }} style={styles.media} contentFit="cover" accessibilityLabel="Post image" />
        )}
      </View>

      {totalReactions > 0 && (
        <View style={styles.activeReactions}>
          {Object.entries(post.reactions).map(([emoji, users]) => {
            if (users.length === 0) return null;
            const isActive = users.includes(currentUserId);
            return (
              <TouchableOpacity
                key={emoji}
                style={[styles.reactionChip, isActive && styles.reactionChipActive]}
                onPress={() => onReact(emoji)}
                accessibilityLabel={`${emoji} ${users.length}`}
              >
                <Text style={styles.reactionChipEmoji}>{emoji}</Text>
                <Text style={[styles.reactionCount, isActive && styles.reactionCountActive]}>{users.length}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.emojiRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiScrollContent}>
          {REACTION_EMOJIS.map(emoji => {
            const users = post.reactions[emoji] || [];
            const isActive = users.includes(currentUserId);
            return (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleReact(emoji)}
                style={[styles.emojiButton, isActive && styles.emojiButtonActive]}
                accessibilityLabel={`React with ${emoji}`}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.reactionSummary}>
            {totalReactions > 0 ? `${totalReactions} reaction${totalReactions > 1 ? 's' : ''}` : ''}
          </Text>
        </View>
        <View style={styles.footerRight}>
          {post.comments.length > 0 && (
            <View style={styles.commentBadge} accessibilityLabel={`${post.comments.length} comments`}>
              <MessageCircle size={13} color={colors.textTertiary} />
              <Text style={styles.commentCount}>{post.comments.length}</Text>
            </View>
          )}
        </View>
      </View>

      <ActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        title="Post options"
        options={actionOptions}
      />
    </View>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default React.memo(PostCardComponent);

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  time: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.teal50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  pinnedText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  moreBtn: {
    marginLeft: 8,
    padding: 4,
  },
  postText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeReactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  emojiRow: {
    marginBottom: 10,
    marginHorizontal: -4,
  },
  emojiScrollContent: {
    paddingHorizontal: 4,
    gap: 6,
  },
  emojiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonActive: {
    backgroundColor: colors.teal100,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  emojiText: {
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flex: 1,
  },
  reactionSummary: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500' as const,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  reactionChipActive: {
    backgroundColor: colors.teal100,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  reactionChipEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  reactionCountActive: {
    color: colors.primary,
  },

  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  commentCount: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});
