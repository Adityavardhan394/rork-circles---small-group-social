import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Image, Dimensions } from 'react-native';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function AnimatedSplashScreen({ onFinish }: SplashScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(15)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(600),
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      glowLoop.stop();
      onFinish();
    });
  }, [logoScale, logoOpacity, textOpacity, textTranslateY, taglineOpacity, taglineTranslateY, fadeOut, glowAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <View style={styles.bgPattern}>
        <Animated.View style={[styles.glowCircle, styles.glow1, { opacity: glowAnim }]} />
        <Animated.View style={[styles.glowCircle, styles.glow2, { opacity: glowAnim }]} />
        <View style={[styles.glowCircle, styles.glow3]} />
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          Huddle
        </Animated.Text>

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          Your groups, amplified.
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.footer, { opacity: taglineOpacity }]}>
        Plans, memories & chaos — all in one place.
      </Animated.Text>
    </Animated.View>
  );
}

const createStyles = (_colors: ColorScheme) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D0820',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  glow1: {
    width: width * 1.2,
    height: width * 1.2,
    top: -width * 0.4,
    right: -width * 0.3,
    backgroundColor: 'rgba(91, 76, 219, 0.15)',
  },
  glow2: {
    width: width * 0.8,
    height: width * 0.8,
    bottom: -width * 0.2,
    left: -width * 0.3,
    backgroundColor: 'rgba(123, 111, 232, 0.1)',
  },
  glow3: {
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.35,
    right: -width * 0.15,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#5B4CDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 42,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    marginBottom: 32,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
});
