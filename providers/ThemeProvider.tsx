import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { ThemeMode } from '@/types';
import { LightColors } from '@/constants/colors';

const THEME_STORAGE_KEY = 'huddle_theme_mode';

export type ColorScheme = typeof LightColors;

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  const themeQuery = useQuery({
    queryKey: ['themeMode'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      return (stored as ThemeMode) ?? 'dark';
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

  const isDark = true;

  const colors = useMemo<ColorScheme>(() => {
    return LightColors;
  }, []);

  return useMemo(() => ({ themeMode, setTheme, isDark, colors }), [themeMode, setTheme, isDark, colors]);
});
