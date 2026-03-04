import { Link, Stack } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme, type ColorScheme } from "@/providers/ThemeProvider";

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go back home</Text>
        </Link>
      </View>
    </>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  link: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.white,
  },
});
