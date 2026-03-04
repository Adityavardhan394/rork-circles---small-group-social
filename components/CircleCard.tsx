import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Circle } from '@/types';

interface CircleCardProps {
  circle: Circle;
  latestActivity?: string;
  onPress: () => void;
}

function CircleCardComponent({ circle, latestActivity, onPress }: CircleCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  const maxAvatars = 4;
  const visibleMembers = circle.members.slice(0, maxAvatars);
  const extraCount = circle.members.length - maxAvatars;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID={`circle-card-${circle.id}`}
        accessibilityLabel={`${circle.name}, ${circle.members.length} members, ${latestActivity || 'no activity'}`}
        accessibilityRole="button"
      >
        <View style={[styles.emojiContainer, { backgroundColor: circle.color + '15' }]}>
          <Text style={styles.emoji}>{circle.emoji}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>{circle.name}</Text>
          <View style={styles.meta}>
            <View style={styles.avatarRow}>
              {visibleMembers.map((member, index) => (
                <View key={member.id} style={[styles.avatarWrapper, { marginLeft: index > 0 ? -8 : 0, zIndex: maxAvatars - index }]}>
                  <Image source={{ uri: member.avatar }} style={styles.avatar} />
                </View>
              ))}
              {extraCount > 0 && (
                <View style={[styles.avatarWrapper, styles.extraBadge, { marginLeft: -8 }]}>
                  <Text style={styles.extraText}>+{extraCount}</Text>
                </View>
              )}
            </View>
            {latestActivity && (
              <Text style={styles.activity} numberOfLines={1}>{latestActivity}</Text>
            )}
          </View>
        </View>
        <ChevronRight size={18} color={Colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default React.memo(CircleCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.surface,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  extraBadge: {
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  activity: {
    fontSize: 12,
    color: Colors.textTertiary,
    flex: 1,
  },
});
