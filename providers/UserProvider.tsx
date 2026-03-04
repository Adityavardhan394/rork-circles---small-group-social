import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types';

const USER_STORAGE_KEY = 'huddle_user';
const ONBOARDED_KEY = 'huddle_onboarded';

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [onboarded, setOnboarded] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as User;
      }
      return null;
    },
  });

  const onboardedQuery = useQuery({
    queryKey: ['onboarded'],
    queryFn: async () => {
      const val = await AsyncStorage.getItem(ONBOARDED_KEY);
      return val === 'true';
    },
  });

  useEffect(() => {
    if (userQuery.data !== undefined) {
      setUser(userQuery.data);
    }
  }, [userQuery.data]);

  useEffect(() => {
    if (onboardedQuery.data !== undefined) {
      setOnboarded(onboardedQuery.data);
    }
  }, [onboardedQuery.data]);

  const saveUserMutation = useMutation({
    mutationFn: async (newUser: User) => {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
      return newUser;
    },
    onSuccess: (newUser) => {
      setUser(newUser);
      setOnboarded(true);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['onboarded'] });
    },
  });

  const { mutate: saveUser } = saveUserMutation;

  const updateUser = useCallback((newUser: User) => {
    saveUser(newUser);
  }, [saveUser]);

  const completeOnboarding = useCallback((name: string, avatar: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      avatar,
      bio: '',
      createdAt: new Date().toISOString(),
    };
    saveUser(newUser);
    console.log('[UserProvider] Onboarding completed for:', name);
  }, [saveUser]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(ONBOARDED_KEY);
      await AsyncStorage.removeItem('huddle_circles');
      await AsyncStorage.removeItem('huddle_posts');
      await AsyncStorage.removeItem('huddle_polls');
      await AsyncStorage.removeItem('huddle_events');
      await AsyncStorage.removeItem('huddle_board');
      await AsyncStorage.removeItem('huddle_notifications');
    },
    onSuccess: () => {
      setUser(null);
      setOnboarded(false);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['onboarded'] });
      queryClient.clear();
      console.log('[UserProvider] User logged out and all data cleared');
    },
  });

  const { mutate: doLogout } = logoutMutation;

  const logout = useCallback(() => {
    doLogout();
  }, [doLogout]);

  const isLoading = userQuery.isLoading || onboardedQuery.isLoading;

  return { user, onboarded, isLoading, updateUser, completeOnboarding, logout };
});
