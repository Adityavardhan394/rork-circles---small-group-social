import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

function SkeletonItem({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: Colors.stone200,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export function CircleCardSkeleton() {
  return (
    <View style={skeletonStyles.circleCard}>
      <SkeletonItem width={48} height={48} borderRadius={14} />
      <View style={skeletonStyles.circleContent}>
        <SkeletonItem width={140} height={16} />
        <View style={skeletonStyles.row}>
          <SkeletonItem width={22} height={22} borderRadius={11} />
          <SkeletonItem width={22} height={22} borderRadius={11} style={{ marginLeft: -8 }} />
          <SkeletonItem width={22} height={22} borderRadius={11} style={{ marginLeft: -8 }} />
          <SkeletonItem width={80} height={12} style={{ marginLeft: 8 }} />
        </View>
      </View>
    </View>
  );
}

export function PostCardSkeleton() {
  return (
    <View style={skeletonStyles.postCard}>
      <View style={skeletonStyles.row}>
        <SkeletonItem width={36} height={36} borderRadius={18} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <SkeletonItem width={100} height={14} />
          <SkeletonItem width={60} height={10} style={{ marginTop: 4 }} />
        </View>
      </View>
      <SkeletonItem height={14} style={{ marginTop: 14 }} />
      <SkeletonItem width="80%" height={14} style={{ marginTop: 6 }} />
      <SkeletonItem height={160} borderRadius={12} style={{ marginTop: 12 }} />
    </View>
  );
}

export function NotificationSkeleton() {
  return (
    <View style={skeletonStyles.notifCard}>
      <SkeletonItem width={40} height={40} borderRadius={20} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <SkeletonItem width={120} height={12} />
        <SkeletonItem height={14} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function FeedSkeleton() {
  return (
    <View>
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <View style={skeletonStyles.homeContainer}>
      <CircleCardSkeleton />
      <CircleCardSkeleton />
      <CircleCardSkeleton />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  homeContainer: {
    paddingTop: 8,
  },
  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  circleContent: {
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  notifCard: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});
