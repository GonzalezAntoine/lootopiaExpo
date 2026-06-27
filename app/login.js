import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const BASE_URL = 'https://lootopia-test.ordwen-dev.com';

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

const ShieldIcon = ({ size = 16, color = C.gold }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.75, height: size * 0.85, borderTopLeftRadius: size * 0.15, borderTopRightRadius: size * 0.15, borderBottomLeftRadius: size * 0.5, borderBottomRightRadius: size * 0.5, borderWidth: 1.5, borderColor: color }} />
  </View>
);

const MailIcon = ({ size = 16, color = C.gold }) => (
  <View style={{ width: size, height: size * 0.75, borderWidth: 1.5, borderColor: color, borderRadius: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-start' }}>
    <View style={{ width: size * 0.7, height: 1.5, backgroundColor: color, transform: [{ rotate: '30deg' }], marginLeft: -2, marginTop: 2 }} />
    <View style={{ width: size * 0.7, height: 1.5, backgroundColor: color, transform: [{ rotate: '-30deg' }], marginLeft: size * 0.3, marginTop: -1 }} />
  </View>
);

// ── Champ de saisie animé ─────────────────────────────────────────────────────
function AnimatedInput({ icon, placeholder, value, onChangeText, secureTextEntry, right, keyboardType }) {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.gold] });

  return (
    <Animated.View style={[styles.inputWrapper, { borderColor }]}>
      <View style={styles.inputIcon}>{icon}</View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={C.textFaint}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
        onBlur={() => Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType || 'default'}
      />
      {right && <View style={styles.inputRight}>{right}</View>}
    </Animated.View>
  );
}

// ── Case 2FA ──────────────────────────────────────────────────────────────────
// Chaque chiffre dans sa propre case
function CodeInput({ value, onChange }) {
  const inputRef = useRef(null);
  const CODE_LENGTH = 6;

  const handleChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    onChange(clean);
    if (clean.length === CODE_LENGTH) inputRef.current?.blur();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
      <View style={styles.codeRow}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => {
          const filled = i < value.length;
          const active = i === value.length;
          return (
            <View
              key={i}
              style={[
                styles.codeBox,
                filled && styles.codeBoxFilled,
                active && styles.codeBoxActive,
              ]}
            >
              <Text style={styles.codeChar}>{value[i] || ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        style={styles.codeHiddenInput}
        caretHidden
      />
    </TouchableOpacity>
  );
}

// ── Minuterie ─────────────────────────────────────────────────────────────────
function Timer({ seconds, onExpire }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const isLow = remaining <= 60;

  return (
    <Text style={[styles.timerText, isLow && styles.timerTextLow]}>
      {min}:{String(sec).padStart(2, '0')}
    </Text>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();

  // Étape : 'login' | '2fa'
  const [step, setStep] = useState('login');

  // Champs login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA
  const [tempToken, setTempToken] = useState(null); // jamais persisté
  const [code, setCode] = useState('');
  const [timerKey, setTimerKey] = useState(0); // reset le timer

  // États
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animations
  const logoFade  = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-20)).current;
  const formFade  = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;
  const stepAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(logoFade,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(logoSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formFade,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // Animation de transition entre login et 2fa
  const transitionTo2FA = () => {
    Animated.sequence([
      Animated.timing(stepAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(stepAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    setStep('2fa');
    setTimerKey(k => k + 1);
  };

  const pressAnim = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // ── Connexion ──────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    pressAnim();
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/login_check`, { username, password });

      if (res.data['2fa_required']) {
        // Stocker le token temporaire EN MÉMOIRE seulement (pas AsyncStorage)
        setTempToken(res.data.token);
        transitionTo2FA();
      } else {
        // Connexion directe sans 2FA
        await AsyncStorage.setItem('token', res.data.token);
        router.replace('/hunts');
      }
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'Identifiants invalides.'
        : 'Erreur de connexion. Réessayez.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Vérification 2FA ───────────────────────────────────────────────────────
  const handle2FA = async () => {
    setError('');
    if (code.length !== 6) {
      setError('Entrez les 6 chiffres du code.');
      return;
    }
    pressAnim();
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/2fa/verify`, {
        token: tempToken,
        code,
      });
      // Token définitif → on persiste
      await AsyncStorage.setItem('token', res.data.token);
      router.replace('/hunts');
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || '';

      if (status === 401 && serverMsg.includes('expiré')) {
        // Token temporaire expiré → retour au login
        setError('Le code a expiré. Veuillez vous reconnecter.');
        setTempToken(null);
        setCode('');
        setTimeout(() => setStep('login'), 2000);
      } else if (status === 401) {
        setError('Code invalide. Vérifiez et réessayez.');
        setCode('');
      } else {
        setError('Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTimerExpire = () => {
    setError('Le code a expiré. Veuillez vous reconnecter.');
    setTempToken(null);
    setCode('');
    setTimeout(() => setStep('login'), 2000);
  };

  const handleBack = () => {
    setStep('login');
    setTempToken(null);
    setCode('');
    setError('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── LOGO ── */}
          <Animated.View style={[styles.brand, { opacity: logoFade, transform: [{ translateY: logoSlide }] }]}>
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

          {/* ── CARD ── */}
          <Animated.View style={[styles.card, { opacity: formFade, transform: [{ translateY: formSlide }] }]}>
            <View style={styles.cardTopLine} />

            {/* ═══════════ ÉTAPE LOGIN ═══════════ */}
            {step === 'login' && (
              <>
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

                {/* Erreur */}
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Bouton */}
                <Animated.View style={[styles.btnWrapper, { transform: [{ scale: btnScale }] }]}>
                  <TouchableOpacity
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={handleLogin}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    <View style={styles.btnInner}>
                      {loading
                        ? <ActivityIndicator color={C.bg} />
                        : <>
                            <Text style={styles.btnText}>Se connecter</Text>
                            <Text style={styles.btnArrow}>›</Text>
                          </>
                      }
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.cardBottom}>
                  <View style={styles.cardBottomDot} />
                  <View style={styles.cardBottomLine} />
                  <View style={styles.cardBottomDot} />
                </View>
              </>
            )}

            {/* ═══════════ ÉTAPE 2FA ═══════════ */}
            {step === '2fa' && (
              <>
                {/* En-tête 2FA */}
                <View style={styles.twoFaHeader}>
                  <View style={styles.twoFaIconWrap}>
                    <ShieldIcon size={24} color={C.gold} />
                  </View>
                  <Text style={styles.cardTitle}>Vérification</Text>
                  <Text style={styles.cardSubtitle}>
                    Un code à 6 chiffres a été envoyé à votre adresse email.
                  </Text>
                </View>

                {/* Info email */}
                <View style={styles.twoFaInfo}>
                  <MailIcon size={13} color={C.goldDim} />
                  <Text style={styles.twoFaInfoText}>
                    Vérifiez votre boîte de réception
                  </Text>
                </View>

                {/* Saisie du code */}
                <View style={styles.fields}>
                  <CodeInput value={code} onChange={setCode} />
                </View>

                {/* Timer */}
                <View style={styles.timerRow}>
                  <Text style={styles.timerLabel}>Expire dans </Text>
                  <Timer key={timerKey} seconds={300} onExpire={handleTimerExpire} />
                </View>

                {/* Erreur */}
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Bouton valider */}
                <Animated.View style={[styles.btnWrapper, { transform: [{ scale: btnScale }] }]}>
                  <TouchableOpacity
                    style={[styles.btn, (loading || code.length !== 6) && styles.btnDisabled]}
                    onPress={handle2FA}
                    activeOpacity={0.85}
                    disabled={loading || code.length !== 6}
                  >
                    <View style={styles.btnInner}>
                      {loading
                        ? <ActivityIndicator color={C.bg} />
                        : <>
                            <Text style={styles.btnText}>Valider le code</Text>
                            <Text style={styles.btnArrow}>›</Text>
                          </>
                      }
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                {/* Retour login */}
                <TouchableOpacity style={styles.backLink} onPress={handleBack}>
                  <Text style={styles.backLinkText}>← Retour à la connexion</Text>
                </TouchableOpacity>

                <View style={styles.cardBottom}>
                  <View style={styles.cardBottomDot} />
                  <View style={styles.cardBottomLine} />
                  <View style={styles.cardBottomDot} />
                </View>
              </>
            )}
          </Animated.View>

          {/* ── FOOTER ── */}
          <Animated.View style={[styles.footer, { opacity: formFade }]}>
            <Text style={styles.footerText}>Lootopia · Explorez · Découvrez · Gagnez</Text>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  // Brand
  brand: { alignItems: 'center', marginBottom: 36 },
  logoRing: { padding: 6, borderRadius: 60, borderWidth: 1, borderColor: C.goldDim, marginBottom: 20 },
  logoRingInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  brandEyebrow: { fontSize: 9, letterSpacing: 5, color: C.goldDim, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4 },
  brandName: { fontSize: 36, fontWeight: '800', color: C.text, letterSpacing: 6, textTransform: 'uppercase' },
  brandTaglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  brandTaglineLine: { width: 40, height: 1, backgroundColor: C.border },
  brandTagline: { fontSize: 11, color: C.textMuted, letterSpacing: 1.5, fontFamily: 'monospace' },

  // Card
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 24 },
  cardTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.6 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: 0.3, paddingHorizontal: 24, paddingTop: 22 },
  cardSubtitle: { fontSize: 13, color: C.textMuted, paddingHorizontal: 24, marginTop: 4, marginBottom: 20 },

  fields: { paddingHorizontal: 20, gap: 12, marginBottom: 16 },

  // Input
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, height: 50, gap: 10 },
  inputIcon: { width: 20, alignItems: 'center' },
  input: { flex: 1, fontSize: 15, color: C.text },
  inputRight: { width: 24, alignItems: 'center' },

  // Erreur
  errorText: { fontSize: 12, color: C.error, textAlign: 'center', paddingHorizontal: 24, marginBottom: 8, lineHeight: 18 },

  // Bouton
  btnWrapper: { paddingHorizontal: 20, marginBottom: 6 },
  btn: { backgroundColor: C.gold, borderRadius: 10, overflow: 'hidden' },
  btnDisabled: { opacity: 0.45 },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 24, gap: 8 },
  btnText: { fontSize: 15, fontWeight: '700', color: C.bg, letterSpacing: 0.5 },
  btnArrow: { fontSize: 20, color: C.bg, fontWeight: '700', lineHeight: 22 },

  // Card bottom
  cardBottom: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 8 },
  cardBottomDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.textFaint },
  cardBottomLine: { flex: 1, height: 1, backgroundColor: C.border },

  // Footer
  footer: { alignItems: 'center' },
  footerText: { fontSize: 10, color: C.textFaint, fontFamily: 'monospace', letterSpacing: 1.5, textAlign: 'center' },

  // ── 2FA ──
  twoFaHeader: { alignItems: 'center', paddingTop: 22, paddingHorizontal: 24 },
  twoFaIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.goldDim,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },

  twoFaInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: C.surfaceAlt, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
    padding: 10,
  },
  twoFaInfoText: { fontSize: 12, color: C.textMuted, flex: 1 },

  // Cases code
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  codeBox: {
    width: 44, height: 52, borderRadius: 8,
    backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  codeBoxFilled: { borderColor: C.goldDim, backgroundColor: '#1F1C10' },
  codeBoxActive: { borderColor: C.gold },
  codeChar: { fontSize: 22, fontWeight: '800', color: C.goldLight, fontFamily: 'monospace' },
  codeHiddenInput: {
    position: 'absolute', opacity: 0, width: 1, height: 1,
  },

  // Timer
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  timerLabel: { fontSize: 12, color: C.textFaint, fontFamily: 'monospace' },
  timerText: { fontSize: 13, color: C.goldDim, fontFamily: 'monospace', fontWeight: '700' },
  timerTextLow: { color: C.error },

  // Lien retour
  backLink: { alignItems: 'center', paddingVertical: 10 },
  backLinkText: { fontSize: 13, color: C.textMuted, letterSpacing: 0.3 },
});