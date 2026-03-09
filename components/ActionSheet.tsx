import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';

export interface ActionSheetOption {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
}

function ActionSheetComponent({ visible, onClose, title, options }: ActionSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 9 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleOptionPress = useCallback((option: ActionSheetOption) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
    setTimeout(() => option.onPress(), 300);
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.overlayBg, { opacity: fadeAnim }]} />
      </Pressable>
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {title && <Text style={styles.title}>{title}</Text>}
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, index > 0 && styles.optionBorder]}
            onPress={() => handleOptionPress(option)}
            activeOpacity={0.6}
            accessibilityLabel={option.label}
            accessibilityRole="button"
          >
            {option.icon && <View style={styles.optionIcon}>{option.icon}</View>}
            <Text style={[styles.optionLabel, option.destructive && styles.optionDestructive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onClose}
          activeOpacity={0.7}
          accessibilityLabel="Cancel"
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

export default React.memo(ActionSheetComponent);

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingVertical: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  optionBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  optionIcon: {
    marginRight: 14,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  optionDestructive: {
    color: colors.danger,
  },
  cancelBtn: {
    marginTop: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
});
