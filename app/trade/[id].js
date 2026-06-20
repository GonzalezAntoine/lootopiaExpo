import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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

const STATUS = {
  pending:   { label: 'En attente', color: C.gold,      bg: '#2A2310' },
  accepted:  { label: 'Accepté',    color: C.accent,    bg: '#131F14' },
  declined:  { label: 'Refusé',     color: C.error,     bg: '#2A1212' },
  cancelled: { label: 'Annulé',     color: C.textMuted, bg: C.surfaceAlt },
};

// ── Helper : résout une IRI vers son objet ────────────────────────────────────
const resolveIri = async (iri, token) => {
  if (!iri || typeof iri !== 'string') return iri; // déjà un objet ou null
  try {
    const url = iri.startsWith('http') ? iri : `${BASE_URL}${iri}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch {
    return null;
  }
};

// Extrait le nom affichable d'un user (objet ou IRI)
const userName = (u) => {
  if (!u) return '—';
  if (typeof u === 'object') return u.username || u.name || '—';
  return '—';
};

// Extrait les initiales d'un user
const userInitials = (u) => {
  const name = userName(u);
  if (name === '—') return '??';
  return name.slice(0, 2).toUpperCase();
};

// Extrait le nom d'un artefact (objet ou IRI)
const artifactName = (a) => {
  if (!a) return '—';
  if (typeof a === 'object') return a.name || a.artifact?.name || '—';
  return '—';
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const BackIcon = ({ size = 16, color = C.text }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '-45deg' }, { translateY: 3 }] }} />
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }, { translateY: -3 }] }} />
    <View style={{ width: size * 0.75, height: 1.5, backgroundColor: color }} />
  </View>
);

const TradeIcon = ({ size = 16, color = C.gold }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <View style={{ width: size * 0.55, height: 1.5, backgroundColor: color }} />
      <View style={{ width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderLeftWidth: 5, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color }} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <View style={{ width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderRightWidth: 5, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: color }} />
      <View style={{ width: size * 0.55, height: 1.5, backgroundColor: color }} />
    </View>
  </View>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────
function LoadingState() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={{ padding: 20, gap: 14 }}>
      {[90, 60, 80, 50].map((w, i) => (
        <Animated.View key={i} style={[styles.skeleton, { width: `${w}%`, opacity: pulse }]} />
      ))}
    </View>
  );
}

// ── Artifact block ────────────────────────────────────────────────────────────
function ArtifactBlock({ label, artifact, quantity, accentColor }) {
  return (
    <View style={[styles.artifactBlock, { borderColor: accentColor + '50' }]}>
      <View style={[styles.artifactBlockBar, { backgroundColor: accentColor }]} />
      <View style={styles.artifactBlockInner}>
        <Text style={styles.artifactBlockLabel}>{label}</Text>
        <Text style={styles.artifactBlockName}>{artifactName(artifact)}</Text>
        <View style={styles.artifactBlockQtyRow}>
          <Text style={[styles.artifactBlockQty, { color: accentColor }]}>×{quantity}</Text>
          <Text style={styles.artifactBlockQtyLabel}>unité{quantity > 1 ? 's' : ''}</Text>
        </View>
      </View>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionLine} />
      </View>
      {children}
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TradeDetailScreen() {
  const { id, mode } = useLocalSearchParams();
  const router = useRouter();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-16)).current;

  useEffect(() => { if (id) fetchTrade(); }, [id]);

  const fetchTrade = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/trades/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const raw = res.data;

      // Résout toutes les IRIs en parallèle
      const [sender, receiver, offeredArtifact, requestedArtifact] = await Promise.all([
        resolveIri(raw.sender, token),
        resolveIri(raw.receiver, token),
        resolveIri(raw.offeredArtifact, token),
        resolveIri(raw.requestedArtifact, token),
      ]);

      setTrade({ ...raw, sender, receiver, offeredArtifact, requestedArtifact });

      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
      ]).start();
    } catch {
      Alert.alert('Erreur', 'Impossible de charger ce trade');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    const labels   = { accept: 'Accepter', decline: 'Refuser', cancel: 'Annuler' };
    const confirms = {
      accept:  "Confirmer l'échange ? Les artefacts seront transférés immédiatement.",
      decline: 'Refuser cette proposition ?',
      cancel:  'Annuler votre proposition de trade ?',
    };

    Alert.alert(labels[action], confirms[action], [
      { text: 'Retour', style: 'cancel' },
      {
        text: labels[action],
        style: action === 'accept' ? 'default' : 'destructive',
        onPress: async () => {
          setActionLoading(action);
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${BASE_URL}/api/trades/${id}/${action}`, {}, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const msgs = {
              accept:  'Échange effectué ! Les artefacts ont été transférés.',
              decline: 'Proposition refusée.',
              cancel:  'Proposition annulée.',
            };
            Alert.alert('Succès', msgs[action], [
              { text: 'OK', onPress: () => router.replace('/trades') },
            ]);
          } catch (err) {
            const msg = err.response?.status === 403
              ? "Vous n'êtes pas autorisé à effectuer cette action."
              : err.response?.data?.message || 'Une erreur est survenue.';
            Alert.alert('Erreur', msg);
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const status    = trade ? (STATUS[trade.status] || STATUS.pending) : null;
  const isPending = trade?.status === 'pending';
  const isReceiver = mode === 'received';
  const isSender   = mode === 'sent';

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: `Trade #${id}` }} />
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerTopLine} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <BackIcon size={16} color={C.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <TradeIcon size={15} color={C.gold} />
            <Text style={styles.headerTitle}>Détail du trade</Text>
          </View>
          <View style={styles.tradeIdBadge}>
            <Text style={styles.tradeIdText}>#{String(id).padStart(3, '0')}</Text>
          </View>
        </View>
      </View>

      {loading ? <LoadingState /> : !trade ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Trade introuvable</Text>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* ── HERO ── */}
            <Animated.View style={[styles.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
              <View style={styles.heroTopLine} />
              <View style={styles.heroInner}>

                {/* Statut */}
                <View style={[styles.statusBadgeLarge, { backgroundColor: status.bg, borderColor: status.color + '60' }]}>
                  <Text style={[styles.statusTextLarge, { color: status.color }]}>{status.label}</Text>
                </View>

                {/* Parties */}
                <View style={styles.partiesRow}>
                  {/* Sender */}
                  <View style={styles.party}>
                    <View style={styles.partyAvatar}>
                      <Text style={styles.partyInitials}>{userInitials(trade.sender)}</Text>
                    </View>
                    <Text style={styles.partyRole}>Propose</Text>
                    <Text style={styles.partyName}>{userName(trade.sender)}</Text>
                  </View>

                  {/* Flèche */}
                  <View style={styles.partiesArrow}>
                    <Text style={styles.partiesArrowText}>⇄</Text>
                  </View>

                  {/* Receiver */}
                  <View style={styles.party}>
                    <View style={[styles.partyAvatar, { borderColor: C.goldDim }]}>
                      <Text style={[styles.partyInitials, { color: C.gold }]}>
                        {userInitials(trade.receiver)}
                      </Text>
                    </View>
                    <Text style={styles.partyRole}>Reçoit</Text>
                    <Text style={styles.partyName}>{userName(trade.receiver)}</Text>
                  </View>
                </View>

                {/* Dates */}
                <View style={styles.datesRow}>
                  <Text style={styles.dateText}>Proposé le {formatDate(trade.createdAt)}</Text>
                  {trade.resolvedAt && (
                    <Text style={styles.dateText}>Résolu le {formatDate(trade.resolvedAt)}</Text>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* ── ÉCHANGE ── */}
            <Section title="ÉCHANGE">
              <View style={styles.exchangeRow}>
                <ArtifactBlock
                  label="Offert"
                  artifact={trade.offeredArtifact}
                  quantity={trade.offeredQuantity}
                  accentColor={C.gold}
                />
                <View style={styles.exchangeArrow}>
                  <Text style={styles.exchangeArrowText}>⇄</Text>
                </View>
                <ArtifactBlock
                  label="Demandé"
                  artifact={trade.requestedArtifact}
                  quantity={trade.requestedQuantity}
                  accentColor={C.accent}
                />
              </View>
            </Section>

            {/* ── MESSAGE ── */}
            {trade.message && trade.message !== 'string' && (
              <Section title="MESSAGE">
                <View style={styles.messageBlock}>
                  <Text style={styles.messageText}>"{trade.message}"</Text>
                </View>
              </Section>
            )}

          </ScrollView>

          {/* ── ACTIONS ── */}
          {isPending && (
            <View style={styles.actions}>
              {isReceiver && (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnAccept]}
                    onPress={() => handleAction('accept')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'accept'
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.actionBtnTextDark}>Accepter</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDecline]}
                    onPress={() => handleAction('decline')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'decline'
                      ? <ActivityIndicator color={C.text} />
                      : <Text style={styles.actionBtnTextLight}>Refuser</Text>
                    }
                  </TouchableOpacity>
                </>
              )}
              {isSender && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnCancel]}
                  onPress={() => handleAction('cancel')}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'cancel'
                    ? <ActivityIndicator color={C.text} />
                    : <Text style={styles.actionBtnTextLight}>Annuler la proposition</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.6 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  tradeIdBadge: { backgroundColor: C.surfaceAlt, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 6 },
  tradeIdText: { fontSize: 11, color: C.goldDim, fontFamily: 'monospace', letterSpacing: 1 },

  scrollContent: { paddingBottom: 24 },

  hero: { margin: 16, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  heroTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.5 },
  heroInner: { padding: 16, gap: 16 },

  statusBadgeLarge: { alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusTextLarge: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1 },

  partiesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  party: { flex: 1, alignItems: 'center', gap: 4 },
  partyAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  partyInitials: { fontSize: 14, fontWeight: '700', color: C.textMuted },
  partyRole: { fontSize: 10, color: C.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },
  partyName: { fontSize: 13, fontWeight: '700', color: C.text, textAlign: 'center' },

  partiesArrow: { alignItems: 'center', justifyContent: 'center', width: 40 },
  partiesArrowText: { fontSize: 20, color: C.goldDim },

  datesRow: { gap: 2 },
  dateText: { fontSize: 10, color: C.textFaint, fontFamily: 'monospace', letterSpacing: 0.5 },

  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: C.textMuted, fontFamily: 'monospace', letterSpacing: 2 },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.border },

  exchangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  artifactBlock: { flex: 1, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  artifactBlockBar: { height: 3, opacity: 0.7 },
  artifactBlockInner: { padding: 12, gap: 4 },
  artifactBlockLabel: { fontSize: 9, color: C.textFaint, fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase' },
  artifactBlockName: { fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 17 },
  artifactBlockQtyRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 },
  artifactBlockQty: { fontSize: 18, fontWeight: '800', fontFamily: 'monospace' },
  artifactBlockQtyLabel: { fontSize: 10, color: C.textFaint },
  exchangeArrow: { alignItems: 'center', justifyContent: 'center' },
  exchangeArrowText: { fontSize: 20, color: C.goldDim },

  messageBlock: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 14 },
  messageText: { fontSize: 14, color: C.textMuted, lineHeight: 20, fontStyle: 'italic' },

  actions: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  actionBtn: { borderRadius: 10, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  actionBtnAccept: { backgroundColor: C.accent },
  actionBtnDecline: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.error + '60' },
  actionBtnCancel: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
  actionBtnTextDark: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  actionBtnTextLight: { fontSize: 15, fontWeight: '600', color: C.textMuted, letterSpacing: 0.3 },

  skeleton: { height: 18, backgroundColor: C.surface, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignSelf: 'flex-start' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, color: C.textMuted },
});