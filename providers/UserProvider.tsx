import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types';
import { CURRENT_USER } from '@/mocks/data';

const USER_STORAGE_KEY = 'circles_user';

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
      const val = await AsyncStorage.getItem('circles_onboarded');
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
      await AsyncStorage.setItem('circles_onboarded', 'true');
      return newUser;
    },
    onSuccess: (newUser) => {
      setUser(newUser);
      setOnboarded(true);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['onboarded'] });
    },
  });

  const updateUser = useCallback((newUser: User) => {
    saveUserMutation.mutate(newUser);
  }, [saveUserMutation]);

  const completeOnboarding = useCallback((name: string, avatar: string) => {
    const newUser: User = {
      ...CURRENT_USER,
      name,
      avatar,
      createdAt: new Date().toISOString(),
    };
    saveUserMutation.mutate(newUser);
  }, [saveUserMutation]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem('circles_onboarded');
    },
    onSuccess: () => {
      setUser(null);
      setOnboarded(false);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['onboarded'] });
      console.log('User logged out successfully');
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const isLoading = userQuery.isLoading || onboardedQuery.isLoading;

  return { user, onboarded, isLoading, updateUser, completeOnboarding, logout };
});
