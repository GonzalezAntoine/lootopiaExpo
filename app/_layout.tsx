import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1A1710" },
          headerTintColor: "#C9A84C",
          headerTitleStyle: {
            color: "#EDE8D8",
            fontWeight: "700",
            fontSize: 16,
          },
          headerBackTitle: "",
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />

        {/* hunts.js — header custom intégré dans le fichier, on masque le natif */}
        <Stack.Screen name="hunts" options={{ headerShown: false }} />

        {/* [id].js — header natif activé, le titre vient de Stack.Screen dans [id].js */}
        <Stack.Screen name="[id]" options={{ title: "Chasse" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
