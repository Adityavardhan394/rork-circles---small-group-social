import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import Colors from '@/constants/colors';
import { Circle } from '@/types';

interface CirclePickerProps {
  circles: Circle[];
  selectedCircleId: string | null;
  onSelect: (circleId: string) => void;
  label?: string;
}

function CirclePickerItem({ circle, selected, onPress }: { circle: Circle; selected: boolean; onPress: () => void }) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  label: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  circleItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.teal50,
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
    color: Colors.text,
  },
  circleNameSelected: {
    color: Colors.primaryDark,
  },
  memberCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
