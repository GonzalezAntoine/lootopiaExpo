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

const CloseIcon = ({ size = 14, color = C.textMuted }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.7, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }], position: 'absolute' }} />
    <View style={{ width: size * 0.7, height: 1.5, backgroundColor: color, transform: [{ rotate: '-45deg' }], position: 'absolute' }} />
  </View>
);

const ClockIcon = ({ size = 14, color = C.textMuted }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.85, height: size * 0.85, borderRadius: size * 0.425, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 1.5, height: size * 0.25, backgroundColor: color, position: 'absolute', top: size * 0.12 }} />
      <View style={{ width: size * 0.2, height: 1.5, backgroundColor: color, position: 'absolute', right: size * 0.12 }} />
    </View>
  </View>
);

// ── Search Input ──────────────────────────────────────────────────────────────
function SearchInput({ placeholder, value, onChangeText, loading }) {
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
        onFocus={() => Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
        onBlur={() => Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {loading && <ActivityIndicator size="small" color={C.goldDim} style={{ marginRight: 10 }} />}
    </Animated.View>
  );
}

// ── Quantity Picker ───────────────────────────────────────────────────────────
function QuantityPicker({ value, onChange, max }) {
  return (
    <View style={styles.qtyRow}>
      <Text style={styles.qtyLabel}>Quantité</Text>
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

// ── Duration Chips ────────────────────────────────────────────────────────────
const DURATION_OPTIONS = [
  { label: '1h', ms: 60 * 60 * 1000 },
  { label: '6h', ms: 6 * 60 * 60 * 1000 },
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
  { label: '3j', ms: 3 * 24 * 60 * 60 * 1000 },
  { label: '7j', ms: 7 * 24 * 60 * 60 * 1000 },
];

function DurationChips({ selectedMs, onSelect }) {
  return (
    <View style={styles.chipRow}>
      {DURATION_OPTIONS.map((opt) => {
        const active = selectedMs === opt.ms;
        return (
          <TouchableOpacity
            key={opt.label}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(active ? null : opt.ms)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Format end date to readable string ────────────────────────────────────────
function formatEndAt(date) {
  if (!date || isNaN(date.getTime())) return null;
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const mins = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} à ${hours}:${mins} UTC`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AuctionNewScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Artifact search
  const [artifactQ, setArtifactQ] = useState('');
  const [artifactResults, setArtifactResults] = useState([]);
  const [artifactLoading, setArtifactLoading] = useState(false);

  // Selections
  const [artifact, setArtifact] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [startingPrice, setStartingPrice] = useState('');
  const [durationMs, setDurationMs] = useState(null);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const debounceRef = useRef(null);

  const debounce = (fn, delay) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fn, delay);
  };

  const getToken = () => AsyncStorage.getItem('token');

  // Compute end date from duration or custom input
  const computedEndAt = (() => {
    if (durationMs) {
      return new Date(Date.now() + durationMs);
    }
    if (customDate && customTime) {
      const d = new Date(`${customDate}T${customTime}:00+00:00`);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  })();

  // When a duration chip is selected, clear custom inputs
  const handleDurationSelect = (ms) => {
    setDurationMs(ms);
    if (ms) {
      setCustomDate('');
      setCustomTime('');
    }
  };

  // When custom input changes, clear duration chips
  const handleCustomDateChange = (text) => {
    setCustomDate(text);
    setDurationMs(null);
  };

  const handleCustomTimeChange = (text) => {
    setCustomTime(text);
    setDurationMs(null);
  };

  // Search artifacts
  useEffect(() => {
    if (artifactQ.length < 2) { setArtifactResults([]); return; }
    debounce(async () => {
      setArtifactLoading(true);
      try {
        const token = await getToken();
        const res = await axios.get(`${BASE_URL}/api/trades/search/artifacts?side=owned&q=${artifactQ}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setArtifactResults(res.data || []);
      } catch { setArtifactResults([]); }
      finally { setArtifactLoading(false); }
    }, 300);
  }, [artifactQ]);

  const handleClearArtifact = () => {
    setArtifact(null);
    setQuantity(1);
    setArtifactQ('');
    setArtifactResults([]);
  };

  const handleSubmit = async () => {
    if (!artifact || !startingPrice || !computedEndAt) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erreur', 'Le prix de départ doit être supérieur à 0');
      return;
    }

    if (computedEndAt <= new Date()) {
      Alert.alert('Erreur', 'La date de fin doit être dans le futur');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      await axios.post(`${BASE_URL}/api/auctions`, {
        artifactId: artifact.id,
        quantity,
        startingPrice: price,
        endAt: computedEndAt.toISOString(),
      }, { headers: { Authorization: `Bearer ${token}` } });

      Alert.alert('Succès', 'Votre enchère a été créée !', [
        { text: 'OK', onPress: () => router.replace('/auctions') },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Impossible de créer l\'enchère';
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = artifact && startingPrice && computedEndAt && computedEndAt > new Date();
  const readableEndAt = formatEndAt(computedEndAt);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerTopLine} />
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <BackIcon size={16} color={C.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nouvelle enchère</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>

            {/* ARTIFACT SELECTION */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ARTIFACT</Text>

              {artifact ? (
                <View style={styles.selectedArtifact}>
                  <View style={styles.selectedArtifactAvatar}>
                    <Text style={styles.selectedArtifactInitials}>
                      {(artifact.initials || artifact.name?.slice(0, 2) || '??').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedArtifactName}>{artifact.name}</Text>
                    {artifact.quantity != null && (
                      <Text style={styles.selectedArtifactQty}>×{artifact.quantity} disponible{artifact.quantity > 1 ? 's' : ''}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={handleClearArtifact} activeOpacity={0.7} style={styles.clearBtn}>
                    <CloseIcon size={14} color={C.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.fieldHint}>Recherchez un artefact que vous possédez (min. 2 caractères)</Text>
                  <SearchInput
                    placeholder="Nom de l'artefact…"
                    value={artifactQ}
                    onChangeText={setArtifactQ}
                    loading={artifactLoading}
                  />
                  {artifactResults.map(a => (
                    <ArtifactResult
                      key={a.id}
                      item={a}
                      selected={artifact}
                      onSelect={(art) => { setArtifact(art); setQuantity(1); setArtifactQ(''); setArtifactResults([]); }}
                    />
                  ))}
                  {artifactQ.length >= 2 && !artifactLoading && artifactResults.length === 0 && (
                    <Text style={styles.noResult}>Aucun artefact trouvé</Text>
                  )}
                </>
              )}
            </View>

            {/* QUANTITY */}
            {artifact && (
              <View style={styles.fieldGroup}>
                <QuantityPicker
                  value={quantity}
                  onChange={setQuantity}
                  max={artifact.quantity}
                />
              </View>
            )}

            {/* STARTING PRICE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PRIX DE DÉPART</Text>
              <View style={styles.priceInputWrapper}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0"
                  placeholderTextColor={C.textFaint}
                  value={startingPrice}
                  onChangeText={setStartingPrice}
                  keyboardType="numeric"
                />
                <Text style={styles.priceUnit}>couronnes</Text>
              </View>
            </View>

            {/* END DATE — DURATION CHIPS */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DURÉE DE L&apos;ENCHÈRE</Text>
              <Text style={styles.fieldHint}>Choisissez une durée rapide ou saisissez manuellement</Text>
              <DurationChips selectedMs={durationMs} onSelect={handleDurationSelect} />
            </View>

            {/* END DATE — CUSTOM INPUTS */}
            <View style={styles.fieldGroup}>
              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.dateSubLabel}>Date (optionnel)</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={C.textFaint}
                    value={customDate}
                    onChangeText={handleCustomDateChange}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.dateSubLabel}>Heure UTC (optionnel)</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="HH:MM"
                    placeholderTextColor={C.textFaint}
                    value={customTime}
                    onChangeText={handleCustomTimeChange}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            {/* READABLE END DATE PREVIEW */}
            {readableEndAt && (
              <View style={styles.endPreview}>
                <ClockIcon size={14} color={C.goldDim} />
                <Text style={styles.endPreviewText}>Se termine le {readableEndAt}</Text>
              </View>
            )}

            {/* SUMMARY CARD */}
            {artifact && startingPrice && computedEndAt && computedEndAt > new Date() && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryTopLine} />
                <Text style={styles.summaryTitle}>Résumé de l&apos;enchère</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Artefact</Text>
                  <Text style={styles.summaryVal}>{artifact.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Quantité</Text>
                  <Text style={styles.summaryVal}>×{quantity}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Prix de départ</Text>
                  <Text style={styles.summaryVal}>{startingPrice} couronnes</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Fin</Text>
                  <Text style={styles.summaryVal}>{readableEndAt}</Text>
                </View>
              </View>
            )}

          </ScrollView>
        </Animated.View>

        {/* ── SUBMIT ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnOff]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting
              ? <ActivityIndicator color={C.bg} />
              : <Text style={styles.submitBtnText}>Créer l&apos;enchère</Text>
            }
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Artifact Result ───────────────────────────────────────────────────────────
function ArtifactResult({ item, selected, onSelect }) {
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
        <Text style={styles.resultName}>{item.name}</Text>
        {item.quantity != null && (
          <Text style={styles.resultSub}>Disponible : ×{item.quantity}</Text>
        )}
      </View>
      {isSelected && (
        <View style={styles.resultCheck}><CheckIcon size={12} color={C.accent} /></View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.6 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  formContent: { padding: 16, paddingBottom: 24, gap: 20 },

  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, fontFamily: 'monospace', letterSpacing: 2 },
  fieldHint: { fontSize: 13, color: C.textMuted, lineHeight: 18 },

  // Search
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, height: 46, paddingHorizontal: 12, gap: 8 },
  searchIcon: { width: 20, alignItems: 'center' },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  noResult: { fontSize: 13, color: C.textFaint, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },

  // Selected artifact card
  selectedArtifact: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim, padding: 14 },
  selectedArtifactAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.goldDim + '30', borderWidth: 1, borderColor: C.goldDim, alignItems: 'center', justifyContent: 'center' },
  selectedArtifactInitials: { fontSize: 14, fontWeight: '700', color: C.gold },
  selectedArtifactName: { fontSize: 14, fontWeight: '700', color: C.text },
  selectedArtifactQty: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  clearBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  // Artifact result
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12 },
  resultRowSelected: { borderColor: C.goldDim, backgroundColor: '#1F1C10' },
  resultAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  resultInitials: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  resultName: { fontSize: 14, fontWeight: '700', color: C.text },
  resultSub: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  resultCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent + '30', borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },

  // Quantity
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 14 },
  qtyLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnOff: { opacity: 0.3 },
  qtyBtnText: { fontSize: 18, color: C.gold, fontWeight: '700', lineHeight: 24 },
  qtyValue: { minWidth: 36, alignItems: 'center' },
  qtyValueText: { fontSize: 18, fontWeight: '700', color: C.goldLight, fontFamily: 'monospace' },

  // Duration chips
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.goldDim + '30', borderColor: C.goldDim },
  chipText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  chipTextActive: { color: C.gold },

  // Price
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 48, gap: 8 },
  priceInput: { flex: 1, fontSize: 15, color: C.gold, fontFamily: 'monospace', fontWeight: '700' },
  priceUnit: { fontSize: 13, color: C.textMuted },

  // Date
  dateRow: { flexDirection: 'row', gap: 10 },
  dateCol: { flex: 1, gap: 4 },
  dateSubLabel: { fontSize: 10, color: C.textFaint, fontFamily: 'monospace', textTransform: 'uppercase' },
  dateInput: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 48, fontSize: 13, color: C.text, fontFamily: 'monospace' },

  // End date preview
  endPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim + '40', padding: 12 },
  endPreviewText: { fontSize: 13, fontWeight: '600', color: C.gold },

  // Summary card
  summaryCard: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  summaryTopLine: { height: 2, backgroundColor: C.goldDim, opacity: 0.5 },
  summaryTitle: { fontSize: 11, fontWeight: '700', color: C.textMuted, fontFamily: 'monospace', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 5 },
  summaryKey: { fontSize: 12, color: C.textFaint },
  summaryVal: { fontSize: 12, color: C.goldLight, fontWeight: '700', maxWidth: '65%', textAlign: 'right' },

  // Footer
  footer: { padding: 16, paddingBottom: 24, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  submitBtn: { backgroundColor: C.gold, borderRadius: 10, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  submitBtnOff: { opacity: 0.4 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: C.bg, letterSpacing: 0.5 },
});
