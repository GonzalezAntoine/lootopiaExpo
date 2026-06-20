import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
    View,
} from 'react-native';

const BASE_URL = 'https://lootopia-test.ordwen-dev.com';

const C = {
  bg: '#0E0C09',
  surface: '#1A1710',
  surfaceAlt: '#211E14',
  border: '#2E2B1E',
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  goldDim: '#7A6128',
  text: '#EDE8D8',
  textMuted: '#8A8470',
  textFaint: '#504C3D',
  accent: '#5C8A5E',
  error: '#C0504A',
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const BackIcon = ({ size = 16, color = C.text }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '-45deg' }, { translateY: 3 }] }} />
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }, { translateY: -3 }] }} />
    <View style={{ width: size * 0.75, height: 1.5, backgroundColor: color }} />
  </View>
);

const SearchIcon = ({ size = 14, color = C.textMuted }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.65, height: size * 0.65, borderRadius: size * 0.33, borderWidth: 1.5, borderColor: color }} />
    <View style={{ width: 1.5, height: size * 0.35, backgroundColor: color, transform: [{ rotate: '45deg' }], position: 'absolute', bottom: 0, right: size * 0.05 }} />
  </View>
);

const CheckIcon = ({ size = 14, color = C.accent }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.35, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }, { translateY: 2 }] }} />
    <View style={{ width: size * 0.6, height: 1.5, backgroundColor: color, transform: [{ rotate: '-55deg' }, { translateX: 3 }] }} />
  </View>
);

// ── Champ de recherche animé ──────────────────────────────────────────────────
function SearchInput({ placeholder, value, onChangeText, loading }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.gold] });

  return (
    <Animated.View style={[styles.searchWrapper, { borderColor }]}>
      <View style={styles.searchIcon}><SearchIcon size={14} color={C.textMuted} /></View>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={C.textFaint}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => { setFocused(true); Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start(); }}
        onBlur={() => { setFocused(false); Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(); }}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {loading && <ActivityIndicator size="small" color={C.goldDim} style={{ marginRight: 10 }} />}
    </Animated.View>
  );
}

// ── Résultat de recherche ─────────────────────────────────────────────────────
function SearchResult({ item, selected, onSelect, showQty = false }) {
  const isSelected = selected?.id === item.id;
  return (
    <TouchableOpacity
      style={[styles.resultRow, isSelected && styles.resultRowSelected]}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.resultAvatar, isSelected && { borderColor: C.gold }]}>
        <Text style={[styles.resultInitials, isSelected && { color: C.gold }]}>
          {(item.initials || item.name?.slice(0, 2) || '??').toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.resultName}>{item.username || item.name}</Text>
        {item.fullname ? <Text style={styles.resultSub}>{item.fullname}</Text> : null}
        {showQty && item.quantity != null ? (
          <Text style={styles.resultSub}>Disponible : ×{item.quantity}</Text>
        ) : null}
      </View>
      {isSelected && (
        <View style={styles.resultCheck}><CheckIcon size={12} color={C.accent} /></View>
      )}
    </TouchableOpacity>
  );
}

// ── Sélecteur de quantité ─────────────────────────────────────────────────────
function QuantityPicker({ value, onChange, max, label }) {
  return (
    <View style={styles.qtyRow}>
      <Text style={styles.qtyLabel}>{label}</Text>
      <View style={styles.qtyControls}>
        <TouchableOpacity
          style={[styles.qtyBtn, value <= 1 && styles.qtyBtnOff]}
          onPress={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.qtyValue}>
          <Text style={styles.qtyValueText}>{value}</Text>
        </View>
        <TouchableOpacity
          style={[styles.qtyBtn, max != null && value >= max && styles.qtyBtnOff]}
          onPress={() => onChange(max != null ? Math.min(max, value + 1) : value + 1)}
          disabled={max != null && value >= max}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Indicateur d'étape ────────────────────────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={styles.stepItem}>
          <View style={[
            styles.stepDot,
            i < current && styles.stepDotDone,
            i === current && styles.stepDotActive,
          ]}>
            {i < current && <Text style={styles.stepDotCheck}>✓</Text>}
            {i === current && <Text style={styles.stepDotNum}>{i + 1}</Text>}
            {i > current && <Text style={styles.stepDotNumInactive}>{i + 1}</Text>}
          </View>
          {i < total - 1 && (
            <View style={[styles.stepLine, i < current && styles.stepLineDone]} />
          )}
        </View>
      ))}
    </View>
  );
}

// ── Résumé de la sélection ────────────────────────────────────────────────────
function SelectionSummary({ receiver, offeredArtifact, offeredQty, requestedArtifact, requestedQty }) {
  if (!receiver && !offeredArtifact && !requestedArtifact) return null;
  return (
    <View style={styles.summary}>
      <View style={styles.summaryTopLine} />
      {receiver && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Destinataire</Text>
          <Text style={styles.summaryVal}>@{receiver.username}</Text>
        </View>
      )}
      {offeredArtifact && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>J'offre</Text>
          <Text style={styles.summaryVal}>×{offeredQty} {offeredArtifact.name}</Text>
        </View>
      )}
      {requestedArtifact && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Je demande</Text>
          <Text style={styles.summaryVal}>×{requestedQty} {requestedArtifact.name}</Text>
        </View>
      )}
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TradeNewScreen() {
  const router = useRouter();

  const [step, setStep] = useState(0); // 0 destinataire | 1 offre | 2 demande | 3 message
  const [submitting, setSubmitting] = useState(false);

  // Recherche
  const [participantQ, setParticipantQ] = useState('');
  const [participantResults, setParticipantResults] = useState([]);
  const [participantLoading, setParticipantLoading] = useState(false);

  const [offeredQ, setOfferedQ] = useState('');
  const [offeredResults, setOfferedResults] = useState([]);
  const [offeredLoading, setOfferedLoading] = useState(false);

  const [requestedQ, setRequestedQ] = useState('');
  const [requestedResults, setRequestedResults] = useState([]);
  const [requestedLoading, setRequestedLoading] = useState(false);

  // Sélections
  const [receiver, setReceiver] = useState(null);
  const [offeredArtifact, setOfferedArtifact] = useState(null);
  const [offeredQty, setOfferedQty] = useState(1);
  const [requestedArtifact, setRequestedArtifact] = useState(null);
  const [requestedQty, setRequestedQty] = useState(1);
  const [message, setMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const debounceRef = useRef(null);

  // Debounce search
  const debounce = (fn, delay) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fn, delay);
  };

  const getToken = () => AsyncStorage.getItem('token');

  // Recherche participants
  useEffect(() => {
    if (participantQ.length < 2) { setParticipantResults([]); return; }
    debounce(async () => {
      setParticipantLoading(true);
      try {
        const token = await getToken();
        const res = await axios.get(`${BASE_URL}/api/trades/search/participants?q=${participantQ}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setParticipantResults(res.data || []);
      } catch { setParticipantResults([]); }
      finally { setParticipantLoading(false); }
    }, 300);
  }, [participantQ]);

  // Recherche artefacts offerts
  useEffect(() => {
    if (step !== 1) return;
    debounce(async () => {
      setOfferedLoading(true);
      try {
        const token = await getToken();
        const res = await axios.get(`${BASE_URL}/api/trades/search/artifacts?side=owned&q=${offeredQ}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOfferedResults(res.data || []);
      } catch { setOfferedResults([]); }
      finally { setOfferedLoading(false); }
    }, 300);
  }, [offeredQ, step]);

  // Recherche artefacts demandés
  useEffect(() => {
    if (step !== 2) return;
    debounce(async () => {
      setRequestedLoading(true);
      try {
        const token = await getToken();
        const res = await axios.get(`${BASE_URL}/api/trades/search/artifacts?side=all&q=${requestedQ}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequestedResults(res.data || []);
      } catch { setRequestedResults([]); }
      finally { setRequestedLoading(false); }
    }, 300);
  }, [requestedQ, step]);

  const animateStep = (nextStep) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(nextStep), 150);
  };

  const handleSubmit = async () => {
    if (!receiver || !offeredArtifact || !requestedArtifact) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await axios.post(`${BASE_URL}/api/trades`, {
        receiverId: receiver.id,
        offeredArtifactId: offeredArtifact.id,
        offeredQuantity: offeredQty,
        requestedArtifactId: requestedArtifact.id,
        requestedQuantity: requestedQty,
        message: message.trim() || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });

      Alert.alert('Trade envoyé !', `${receiver.username} a reçu votre proposition.`, [
        { text: 'OK', onPress: () => router.replace('/trades') },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Impossible d\'envoyer le trade';
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = [
    !!receiver,
    !!offeredArtifact,
    !!requestedArtifact,
    true,
  ][step];

  const STEP_LABELS = ['Destinataire', 'J\'offre', 'Je demande', 'Message'];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerTopLine} />
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => step > 0 ? animateStep(step - 1) : router.back()}>
              <BackIcon size={16} color={C.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nouveau trade</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Indicateur étapes */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
            <StepIndicator current={step} total={4} />
            <Text style={styles.stepLabel}>{STEP_LABELS[step]}</Text>
          </View>
        </View>

        {/* Résumé des sélections */}
        <SelectionSummary
          receiver={receiver}
          offeredArtifact={offeredArtifact}
          offeredQty={offeredQty}
          requestedArtifact={requestedArtifact}
          requestedQty={requestedQty}
        />

        {/* ── CONTENU PAR ÉTAPE ── */}
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>

            {/* ÉTAPE 0 — Destinataire */}
            {step === 0 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHint}>Recherchez un joueur (min. 2 caractères)</Text>
                <SearchInput
                  placeholder="Nom d'utilisateur…"
                  value={participantQ}
                  onChangeText={setParticipantQ}
                  loading={participantLoading}
                />
                {participantResults.map(p => (
                  <SearchResult key={p.id} item={p} selected={receiver} onSelect={setReceiver} />
                ))}
                {participantQ.length >= 2 && !participantLoading && participantResults.length === 0 && (
                  <Text style={styles.noResult}>Aucun joueur trouvé</Text>
                )}
              </View>
            )}

            {/* ÉTAPE 1 — Ce qu'on offre */}
            {step === 1 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHint}>Choisissez un artefact que vous possédez</Text>
                <SearchInput
                  placeholder="Rechercher parmi mes artefacts…"
                  value={offeredQ}
                  onChangeText={setOfferedQ}
                  loading={offeredLoading}
                />
                {offeredResults.map(a => (
                  <SearchResult key={a.id} item={a} selected={offeredArtifact} onSelect={(art) => { setOfferedArtifact(art); setOfferedQty(1); }} showQty />
                ))}
                {offeredArtifact && (
                  <QuantityPicker
                    label="Quantité offerte"
                    value={offeredQty}
                    onChange={setOfferedQty}
                    max={offeredArtifact.quantity}
                  />
                )}
              </View>
            )}

            {/* ÉTAPE 2 — Ce qu'on demande */}
            {step === 2 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHint}>Choisissez l'artefact que vous souhaitez recevoir</Text>
                <SearchInput
                  placeholder="Rechercher tous les artefacts…"
                  value={requestedQ}
                  onChangeText={setRequestedQ}
                  loading={requestedLoading}
                />
                {requestedResults.map(a => (
                  <SearchResult key={a.id} item={a} selected={requestedArtifact} onSelect={(art) => { setRequestedArtifact(art); setRequestedQty(1); }} />
                ))}
                {requestedArtifact && (
                  <QuantityPicker
                    label="Quantité demandée"
                    value={requestedQty}
                    onChange={setRequestedQty}
                    max={null}
                  />
                )}
              </View>
            )}

            {/* ÉTAPE 3 — Message */}
            {step === 3 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHint}>Ajoutez un message (optionnel)</Text>
                <Animated.View style={[styles.searchWrapper, { borderColor: C.border }]}>
                  <TextInput
                    style={[styles.searchInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                    placeholder="Votre message…"
                    placeholderTextColor={C.textFaint}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={200}
                  />
                </Animated.View>
                <Text style={styles.charCount}>{message.length}/200</Text>
              </View>
            )}

          </ScrollView>
        </Animated.View>

        {/* ── BOUTON NAVIGATION ── */}
        <View style={styles.footer}>
          {step < 3 ? (
            <TouchableOpacity
              style={[styles.nextBtn, !canNext && styles.nextBtnOff]}
              onPress={() => animateStep(step + 1)}
              disabled={!canNext}
            >
              <Text style={styles.nextBtnText}>Continuer</Text>
              <Text style={styles.nextBtnArrow}>›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, submitting && styles.nextBtnOff]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={C.bg} />
                : <Text style={styles.nextBtnText}>Envoyer la proposition</Text>
              }
            </TouchableOpacity>
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.6 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  // Indicateur étapes
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: C.gold, backgroundColor: C.goldDim + '40' },
  stepDotDone: { borderColor: C.accent, backgroundColor: C.accent + '30' },
  stepDotNum: { fontSize: 11, fontWeight: '700', color: C.gold, fontFamily: 'monospace' },
  stepDotNumInactive: { fontSize: 11, color: C.textFaint, fontFamily: 'monospace' },
  stepDotCheck: { fontSize: 10, color: C.accent, fontWeight: '700' },
  stepLine: { flex: 1, height: 1, backgroundColor: C.border, marginHorizontal: 2 },
  stepLineDone: { backgroundColor: C.accent },
  stepLabel: { fontSize: 11, color: C.goldDim, fontFamily: 'monospace', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 6 },

  // Résumé
  summary: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, overflow: 'hidden' },
  summaryTopLine: { height: 1, backgroundColor: C.goldDim, opacity: 0.4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 6 },
  summaryKey: { fontSize: 11, color: C.textFaint, fontFamily: 'monospace', letterSpacing: 0.5 },
  summaryVal: { fontSize: 11, color: C.goldLight, fontFamily: 'monospace', fontWeight: '700', maxWidth: '60%', textAlign: 'right' },

  // Étape
  stepContent: { padding: 16, paddingBottom: 24 },
  stepSection: { gap: 10 },
  stepHint: { fontSize: 13, color: C.textMuted, lineHeight: 18, marginBottom: 4 },
  noResult: { fontSize: 13, color: C.textFaint, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  charCount: { fontSize: 10, color: C.textFaint, fontFamily: 'monospace', textAlign: 'right' },

  // Recherche
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, height: 46, paddingHorizontal: 12, gap: 8 },
  searchIcon: { width: 20, alignItems: 'center' },
  searchInput: { flex: 1, fontSize: 14, color: C.text },

  // Résultats
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12 },
  resultRowSelected: { borderColor: C.goldDim, backgroundColor: '#1F1C10' },
  resultAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  resultInitials: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  resultName: { fontSize: 14, fontWeight: '700', color: C.text },
  resultSub: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  resultCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent + '30', borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },

  // Quantité
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 14, marginTop: 4 },
  qtyLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnOff: { opacity: 0.3 },
  qtyBtnText: { fontSize: 18, color: C.gold, fontWeight: '700', lineHeight: 24 },
  qtyValue: { minWidth: 36, alignItems: 'center' },
  qtyValueText: { fontSize: 18, fontWeight: '700', color: C.goldLight, fontFamily: 'monospace' },

  // Footer
  footer: { padding: 16, paddingBottom: 24, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  nextBtn: { backgroundColor: C.gold, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  nextBtnOff: { opacity: 0.4 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: C.bg, letterSpacing: 0.5 },
  nextBtnArrow: { fontSize: 20, color: C.bg, fontWeight: '700', lineHeight: 22 },
});