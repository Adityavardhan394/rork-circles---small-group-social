import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { Poll } from '@/types';

interface PollCardProps {
  poll: Poll;
  onVote: (optionId: string) => void;
  currentUserId: string;
}

function PollCardComponent({ poll, onVote, currentUserId }: PollCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
  const _userVotedOption = poll.options.find(o => o.votes.includes(currentUserId));

  const handleVote = useCallback((optionId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onVote(optionId);
  }, [onVote]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: poll.author.avatar }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{poll.author.name}</Text>
          <View style={styles.pollLabel}>
            <BarChart3 size={12} color={colors.accent} />
            <Text style={styles.pollLabelText}>Poll</Text>
          </View>
        </View>
      </View>
      <Text style={styles.question}>{poll.question}</Text>
      <View style={styles.options}>
        {poll.options.map(option => {
          const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
          const isSelected = option.votes.includes(currentUserId);
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => handleVote(option.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionFill, { width: `${percentage}%` }, isSelected && styles.optionFillSelected]} />
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.text}</Text>
              <Text style={[styles.optionPercent, isSelected && styles.optionPercentSelected]}>{percentage}%</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.voteCount}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</Text>
    </View>
  );
}

export default React.memo(PollCardComponent);

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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerText: {
    marginLeft: 10,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  pollLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  pollLabelText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  question: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  options: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    overflow: 'hidden',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.teal50,
  },
  optionFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
  },
  optionFillSelected: {
    backgroundColor: colors.teal100,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    zIndex: 1,
  },
  optionTextSelected: {
    fontWeight: '600' as const,
    color: colors.primaryDark,
  },
  optionPercent: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500' as const,
    zIndex: 1,
  },
  optionPercentSelected: {
    color: colors.primary,
  },
  voteCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
  },
});
