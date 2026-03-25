import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Animated,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0E0C09',
  surface: '#1A1710',
  surfaceAlt: '#211E14',
  border: '#2E2B1E',
  borderFocus: '#C9A84C',
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  goldDim: '#7A6128',
  text: '#EDE8D8',
  textMuted: '#8A8470',
  textFaint: '#504C3D',
  accent: '#5C8A5E',
  error: '#C0504A',
};

// ── Icônes ────────────────────────────────────────────────────────────────────
const UserIcon = ({ size = 16, color = C.textMuted }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25, borderWidth: 1.5, borderColor: color }} />
    <View style={{ width: size * 0.8, height: size * 0.35, borderTopLeftRadius: size * 0.4, borderTopRightRadius: size * 0.4, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0, marginTop: 1 }} />
  </View>
);

const LockIcon = ({ size = 16, color = C.textMuted }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.6, height: size * 0.45, borderRadius: 2, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
    </View>
    <View style={{ width: size * 0.55, height: size * 0.3, borderTopLeftRadius: size * 0.28, borderTopRightRadius: size * 0.28, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0, position: 'absolute', top: 0 }} />
  </View>
);

const EyeIcon = ({ size = 16, color = C.textMuted, closed = false }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {closed ? (
      <View style={{ width: size * 0.8, height: 1.5, backgroundColor: color, transform: [{ rotate: '-20deg' }] }} />
    ) : (
      <>
        <View style={{ width: size * 0.75, height: size * 0.5, borderRadius: size * 0.3, borderWidth: 1.5, borderColor: color }} />
        <View style={{ position: 'absolute', width: size * 0.25, height: size * 0.25, borderRadius: size * 0.125, backgroundColor: color }} />
      </>
    )}
  </View>
);

const CompassIcon = ({ size = 40, color = C.gold }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 2, height: size * 0.35, backgroundColor: '#E55' }} />
      <View style={{ width: 2, height: size * 0.35, backgroundColor: color, marginTop: -2 }} />
    </View>
  </View>
);

// ── Animated Input ─────────────────────────────────────────────────────────────
function AnimatedInput({ icon, placeholder, value, onChangeText, secureTextEntry, right }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.border, C.gold],
  });

  return (
    <Animated.View style={[styles.inputWrapper, { borderColor }]}>
      <View style={styles.inputIcon}>{icon}</View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={C.textFaint}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {right && <View style={styles.inputRight}>{right}</View>}
    </Animated.View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Entrance animations
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-20)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(logoFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(logoSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs');
      return;
    }
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    setLoading(true);
    try {
      const response = await axios.post(
        'https://lootopia-test.ordwen-dev.com/api/login_check',
        { username, password }
      );
      await AsyncStorage.setItem('token', response.data.token);
      router.replace('/hunts');
    } catch (error) {
      Alert.alert('Échec de connexion', 'Identifiants invalides. Vérifiez vos informations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── LOGO / BRAND ── */}
          <Animated.View style={[styles.brand, { opacity: logoFade, transform: [{ translateY: logoSlide }] }]}>
            {/* Decorative ring */}
            <View style={styles.logoRing}>
              <View style={styles.logoRingInner}>
                <CompassIcon size={40} color={C.gold} />
              </View>
            </View>

            <Text style={styles.brandEyebrow}>BIENVENUE SUR</Text>
            <Text style={styles.brandName}>LOOTOPIA</Text>
            <View style={styles.brandTaglineRow}>
              <View style={styles.brandTaglineLine} />
              <Text style={styles.brandTagline}>Partez à l'aventure</Text>
              <View style={styles.brandTaglineLine} />
            </View>
          </Animated.View>

          {/* ── FORM CARD ── */}
          <Animated.View style={[styles.card, { opacity: formFade, transform: [{ translateY: formSlide }] }]}>
            <View style={styles.cardTopLine} />

            <Text style={styles.cardTitle}>Connexion</Text>
            <Text style={styles.cardSubtitle}>Entrez vos identifiants pour continuer</Text>

            <View style={styles.fields}>
              <AnimatedInput
                icon={<UserIcon size={16} color={C.textMuted} />}
                placeholder="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
              />
              <AnimatedInput
                icon={<LockIcon size={16} color={C.textMuted} />}
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                right={
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                    <EyeIcon size={16} color={C.textMuted} closed={showPassword} />
                  </TouchableOpacity>
                }
              />
            </View>

            {/* Submit button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                <View style={styles.btnInner}>
                  {loading ? (
                    <Text style={styles.btnText}>Connexion en cours…</Text>
                  ) : (
                    <>
                      <Text style={styles.btnText}>Se connecter</Text>
                      <Text style={styles.btnArrow}>›</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Decorative bottom */}
            <View style={styles.cardBottom}>
              <View style={styles.cardBottomDot} />
              <View style={styles.cardBottomLine} />
              <View style={styles.cardBottomDot} />
            </View>
          </Animated.View>

          {/* ── FOOTER ── */}
          <Animated.View style={[styles.footer, { opacity: formFade }]}>
            <Text style={styles.footerText}>
              Lootopia · Explorez · Découvrez · Gagnez
            </Text>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // Brand
  brand: { alignItems: 'center', marginBottom: 36 },
  logoRing: {
    padding: 6,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: C.goldDim,
    marginBottom: 20,
  },
  logoRingInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  brandEyebrow: {
    fontSize: 9, letterSpacing: 5,
    color: C.goldDim, fontFamily: 'monospace',
    textTransform: 'uppercase', marginBottom: 4,
  },
  brandName: {
    fontSize: 36, fontWeight: '800',
    color: C.text, letterSpacing: 6,
    textTransform: 'uppercase',
  },
  brandTaglineRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginTop: 8,
  },
  brandTaglineLine: { flex: 1, height: 1, backgroundColor: C.border, maxWidth: 40 },
  brandTagline: { fontSize: 11, color: C.textMuted, letterSpacing: 1.5, fontFamily: 'monospace' },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  cardTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.6 },
  cardTitle: {
    fontSize: 20, fontWeight: '700',
    color: C.text, letterSpacing: 0.3,
    paddingHorizontal: 24, paddingTop: 22,
  },
  cardSubtitle: {
    fontSize: 13, color: C.textMuted,
    paddingHorizontal: 24, marginTop: 4, marginBottom: 24,
  },

  fields: { paddingHorizontal: 20, gap: 12, marginBottom: 20 },

  // Input
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceAlt,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, height: 50,
    gap: 10,
  },
  inputIcon: { width: 20, alignItems: 'center' },
  input: {
    flex: 1, fontSize: 15,
    color: C.text,
  },
  inputRight: { width: 24, alignItems: 'center' },

  // Button
  btn: {
    marginHorizontal: 20,
    marginBottom: 6,
    backgroundColor: C.gold,
    borderRadius: 10,
    overflow: 'hidden',
  },
  btnDisabled: { opacity: 0.6 },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 24,
    gap: 8,
  },
  btnText: {
    fontSize: 15, fontWeight: '700',
    color: C.bg, letterSpacing: 0.5,
  },
  btnArrow: {
    fontSize: 20, color: C.bg,
    fontWeight: '700', lineHeight: 22,
  },

  // Card bottom decoration
  cardBottom: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14,
    gap: 8,
  },
  cardBottomDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: C.textFaint,
  },
  cardBottomLine: { flex: 1, height: 1, backgroundColor: C.border },

  // Footer
  footer: { alignItems: 'center' },
  footerText: {
    fontSize: 10, color: C.textFaint,
    fontFamily: 'monospace', letterSpacing: 1.5,
    textAlign: 'center',
  },
});