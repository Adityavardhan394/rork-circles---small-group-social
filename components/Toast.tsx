import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Check, AlertTriangle, Info, X } from 'lucide-react-native';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide: () => void;
  duration?: number;
}



function ToastComponent({ visible, message, type = 'success', onHide, duration = 3000 }: ToastProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ICON_MAP = useMemo(() => ({
    success: { icon: Check, color: colors.success, bg: 'rgba(16,185,129,0.15)' },
    error: { icon: X, color: colors.danger, bg: 'rgba(239,68,68,0.15)' },
    warning: { icon: AlertTriangle, color: colors.warning, bg: 'rgba(245,158,11,0.15)' },
    info: { icon: Info, color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  }), [colors]);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, translateY, opacity, onHide, duration]);

  if (!visible) return null;

  const config = ICON_MAP[type];
  const Icon = config.icon;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.bg, transform: [{ translateY }], opacity },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
        <Icon size={16} color={config.color} />
      </View>
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

export default React.memo(ToastComponent);

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 9999,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
    lineHeight: 20,
  },
});
