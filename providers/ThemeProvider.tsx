import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { ThemeMode } from '@/types';
import { LightColors, DarkColors } from '@/constants/colors';

const THEME_STORAGE_KEY = 'huddle_theme_mode';

export type ColorScheme = typeof LightColors;

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  const themeQuery = useQuery({
    queryKey: ['themeMode'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      return (stored as ThemeMode) ?? 'system';
    },
  });

  useEffect(() => {
    if (themeQuery.data) {
      setThemeMode(themeQuery.data);
    }
  }, [themeQuery.data]);

  const setTheme = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    console.log('[ThemeProvider] Theme set to:', mode);
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') return systemScheme === 'dark';
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors = useMemo<ColorScheme>(() => {
    return isDark ? DarkColors : LightColors;
  }, [isDark]);

  return { themeMode, setTheme, isDark, colors };
});
