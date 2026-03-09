import React, { useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { Circle } from '@/types';

const CARD_COLORS = ['#F5D5A8', '#B8E6C8', '#C5B8E8', '#F5D76E', '#A8D4F5', '#F5B8D5'];
const CARD_TEXT_COLORS = ['#5C3D1A', '#1A4D2E', '#2E1A5C', '#5C4D1A', '#1A3D5C', '#5C1A3D'];

interface CircleCardProps {
  circle: Circle;
  latestActivity?: string;
  onPress: () => void;
}

function CircleCardComponent({ circle, latestActivity, onPress }: CircleCardProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const colorIndex = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < circle.id.length; i++) {
      hash = circle.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % CARD_COLORS.length;
  }, [circle.id]);

  const cardBg = CARD_COLORS[colorIndex];
  const cardText = CARD_TEXT_COLORS[colorIndex];
  const styles = useMemo(() => createStyles(colors, cardBg, cardText), [colors, cardBg, cardText]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  const maxAvatars = 3;
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
        <View style={styles.cardHeader}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{circle.emoji}</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.name} numberOfLines={1}>{circle.name}</Text>
            {latestActivity && (
              <Text style={styles.activity} numberOfLines={1}>{latestActivity}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handlePress}>
            <Plus size={18} color={cardText} />
          </TouchableOpacity>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.avatarRow}>
            {visibleMembers.map((member, index) => (
              <View key={member.id} style={[styles.avatarWrapper, { marginLeft: index > 0 ? -8 : 0, zIndex: maxAvatars - index }]}>
                <Image source={{ uri: member.avatar }} style={styles.avatar} />
              </View>
            ))}
            {extraCount > 0 && (
              <View style={[styles.avatarWrapper, styles.extraBadge, { marginLeft: -8 }]}>
                <Text style={styles.extraText}>{circle.members.length}+</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default React.memo(CircleCardComponent);

const createStyles = (colors: ColorScheme, cardBg: string, cardText: string) => StyleSheet.create({
  card: {
    backgroundColor: cardBg,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: cardText,
    marginBottom: 2,
  },
  activity: {
    fontSize: 12,
    color: cardText,
    opacity: 0.7,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: cardText + '30',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    marginTop: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: cardBg,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  extraBadge: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: cardText,
  },
});
