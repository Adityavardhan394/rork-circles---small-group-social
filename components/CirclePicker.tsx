import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { Circle } from '@/types';

interface CirclePickerProps {
  circles: Circle[];
  selectedCircleId: string | null;
  onSelect: (circleId: string) => void;
  label?: string;
}

function CirclePickerItem({ circle, selected, onPress }: { circle: Circle; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={[styles.circleItem, selected && styles.circleItemSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`circle-pick-${circle.id}`}
    >
      <View style={[styles.emojiContainer, { backgroundColor: circle.color + '18' }]}>
        <Text style={styles.emoji}>{circle.emoji}</Text>
      </View>
      <View style={styles.circleInfo}>
        <Text style={[styles.circleName, selected && styles.circleNameSelected]} numberOfLines={1}>
          {circle.name}
        </Text>
        <Text style={styles.memberCount}>
          {circle.members.length} member{circle.members.length !== 1 ? 's' : ''}
        </Text>
      </View>
      {selected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const MemoizedItem = React.memo(CirclePickerItem);

export default function CirclePicker({ circles, selectedCircleId, onSelect, label }: CirclePickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const handlePress = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label ?? 'Select a Huddle'}</Text>
      <Text style={styles.subtitle}>Choose which group this belongs to</Text>
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {circles.map((circle) => (
          <MemoizedItem
            key={circle.id}
            circle={circle}
            selected={selectedCircleId === circle.id}
            onPress={() => handlePress(circle.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  label: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  circleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  circleItemSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(91,76,219,0.12)',
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  circleNameSelected: {
    color: colors.primaryDark,
  },
  memberCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
