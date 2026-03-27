import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserProvider } from "@/providers/UserProvider";
import { CirclesProvider } from "@/providers/CirclesProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { MessagesProvider } from "@/providers/MessagesProvider";
import AnimatedSplashScreen from "@/components/SplashScreen";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-circle"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="create-post"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="create-poll"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="create-event"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="members/[id]"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="settings"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="connections"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="chat"
        options={{ presentation: "card", headerShown: false }}
      />
      <Stack.Screen
        name="expenses"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="analytics"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="onboarding"
        options={{ presentation: "fullScreenModal", headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <ThemeProvider>
            <UserProvider>
              <CirclesProvider>
                <MessagesProvider>
                  <RootLayoutNav />
                  {showSplash && <AnimatedSplashScreen onFinish={handleSplashFinish} />}
                </MessagesProvider>
              </CirclesProvider>
            </UserProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
