import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          // Style global appliqué à tous les headers natifs
          headerStyle: { backgroundColor: '#1A1710' },
          headerTintColor: '#C9A84C',          // couleur du bouton retour + titre
          headerTitleStyle: {
            color: '#EDE8D8',
            fontWeight: '700',
            fontSize: 16,
          },
          headerBackTitle: '',                  // pas de libellé sur le bouton retour iOS
          headerShadowVisible: false,
          // Ligne dorée sous le header natif
          headerBottomContainerStyle: {
            borderBottomWidth: 2,
            borderBottomColor: '#C9A84C',
          },
        }}
      >
        {/* ── Onglets principaux ── */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal"  options={{ presentation: 'modal', title: 'Modal' }} />

        {/* ── Écrans avec header CUSTOM intégré (headerShown: false) ── */}
        <Stack.Screen name="hunts"       options={{ headerShown: false }} />
        <Stack.Screen name="profile"     options={{ title: 'Profil' }} />
        <Stack.Screen name="leaderboard" options={{ title: 'Classement' }} />
        <Stack.Screen name="artifacts"   options={{ title: 'Artefacts' }} />

        {/* ── Écrans avec header NATIF (titre dynamique via Stack.Screen) ── */}

        {/* Détail chasse — titre passé en param depuis hunts.js */}
        <Stack.Screen name="hunt/[id]" options={{ title: 'Chasse' }} />

        {/* Trades — header natif doré, bouton retour automatique */}
        <Stack.Screen name="trades"     options={{ title: 'Trades' }} />
        <Stack.Screen name="trade-new"  options={{ title: 'Nouveau trade' }} />
        <Stack.Screen name="trade/[id]" options={{ title: 'Détail du trade' }} />

        {/* Annonces — header natif doré, bouton retour automatique */}
        <Stack.Screen name="listings"      options={{ title: 'Annonces' }} />
        <Stack.Screen name="listing-new"   options={{ title: 'Nouvelle annonce' }} />
        <Stack.Screen name="listing/[id]"  options={{ title: 'Détail de l\'annonce' }} />

      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}