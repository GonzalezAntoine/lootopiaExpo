import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert,
  Animated,
  FlatList,
  SafeAreaView,
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
  pending:   { label: 'En attente', color: C.gold,     bg: '#2A2310' },
  accepted:  { label: 'Accepté',    color: C.accent,   bg: '#131F14' },
  declined:  { label: 'Refusé',     color: C.error,    bg: '#2A1212' },
  cancelled: { label: 'Annulé',     color: C.textMuted, bg: C.surfaceAlt },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const idFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1];
};

// Résout une IRI vers son objet complet, avec cache pour éviter les doublons
const cache = {};
const resolveIri = async (iri, token) => {
  if (!iri || typeof iri !== 'string') return null;
  if (cache[iri]) return cache[iri];
  try {
    // L'IRI peut être absolue ("https://...") ou relative ("/api/...")
    const url = iri.startsWith('http') ? iri : `${BASE_URL}${iri}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    cache[iri] = res.data;
    return res.data;
  } catch {
    return null;
  }
};

// Enrichit un trade en résolvant toutes ses IRIs
const enrichTrade = async (trade, token) => {
  const [sender, receiver, offeredArtifact, requestedArtifact] = await Promise.all([
    resolveIri(trade.sender, token),
    resolveIri(trade.receiver, token),
    resolveIri(trade.offeredArtifact, token),
    resolveIri(trade.requestedArtifact, token),
  ]);
  return { ...trade, sender, receiver, offeredArtifact, requestedArtifact };
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const BackIcon = ({ size = 16, color = C.text }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '-45deg' }, { translateY: 3 }] }} />
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }, { translateY: -3 }] }} />
    <View style={{ width: size * 0.75, height: 1.5, backgroundColor: color }} />
  </View>
);

const PlusIcon = ({ size = 16, color = C.bg }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size, height: 2, backgroundColor: color, position: 'absolute' }} />
    <View style={{ width: 2, height: size, backgroundColor: color, position: 'absolute' }} />
  </View>
);

const TradeIcon = ({ size = 18, color = C.gold }) => (
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
function LoadingSkeleton() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={{ gap: 10, padding: 16 }}>
      {[1, 2, 3].map(i => (
        <Animated.View key={i} style={[styles.skeleton, { opacity: pulse }]} />
      ))}
    </View>
  );
}

// ── Trade Card ────────────────────────────────────────────────────────────────
function TradeCard({ item, mode, index, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 70, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const status = STATUS[item.status] || STATUS.pending;
  const date = new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  // Après enrichissement, sender/receiver sont des objets
  const counterpart = mode === 'sent' ? item.receiver : item.sender;
  const counterpartName = counterpart?.username || counterpart?.name || `#${idFromUrl(typeof counterpart === 'string' ? counterpart : '')}`;
  const counterpartInitials = counterpartName.slice(0, 2).toUpperCase();

  // offeredArtifact / requestedArtifact sont des objets après enrichissement
  const offeredName = item.offeredArtifact?.name || item.offeredArtifact?.artifact?.name || '…';
  const requestedName = item.requestedArtifact?.name || item.requestedArtifact?.artifact?.name || '…';

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <View style={styles.tradeCard}>
          <View style={[styles.tradeAccent, { backgroundColor: status.color }]} />
          <View style={styles.tradeInner}>

            {/* Header */}
            <View style={styles.tradeHeader}>
              <View style={styles.tradeCounterpart}>
                <View style={styles.counterpartAvatar}>
                  <Text style={styles.counterpartInitials}>{counterpartInitials}</Text>
                </View>
                <View>
                  <Text style={styles.counterpartLabel}>
                    {mode === 'sent' ? 'Pour' : 'De'}
                  </Text>
                  <Text style={styles.counterpartName}>{counterpartName}</Text>
                </View>
              </View>

              <View style={styles.tradeHeaderRight}>
                <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.color + '60' }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
                <Text style={styles.tradeDate}>{date}</Text>
              </View>
            </View>

            {/* Échange */}
            <View style={styles.tradeExchange}>
              <View style={styles.tradeArtifact}>
                <Text style={styles.tradeArtifactQty}>×{item.offeredQuantity}</Text>
                <Text style={styles.tradeArtifactName} numberOfLines={2}>{offeredName}</Text>
              </View>
              <View style={styles.tradeArrow}>
                <Text style={{ color: C.goldDim, fontSize: 16 }}>⇄</Text>
              </View>
              <View style={[styles.tradeArtifact, { alignItems: 'flex-end' }]}>
                <Text style={styles.tradeArtifactQty}>×{item.requestedQuantity}</Text>
                <Text style={[styles.tradeArtifactName, { textAlign: 'right' }]} numberOfLines={2}>{requestedName}</Text>
              </View>
            </View>

            {/* Message */}
            {item.message && item.message !== 'string' && (
              <View style={styles.tradeMessage}>
                <Text style={styles.tradeMessageText} numberOfLines={1}>"{item.message}"</Text>
              </View>
            )}

            {/* CTA reçus en attente */}
            {mode === 'received' && item.status === 'pending' && (
              <View style={styles.tradeCta}>
                <Text style={styles.tradeCtaText}>Appuyer pour répondre →</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TradesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [allTrades, setAllTrades] = useState([]);
  const [meUrl, setMeUrl] = useState(null);
  const [tab, setTab] = useState('received');
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [meRes, tradesRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/me`, { headers }),
        axios.get(`${BASE_URL}/api/trades`, { headers }),
      ]);

      const userIri = meRes.data['@id'] || meRes.data.iri || `/api/participants/${meRes.data.id}`;
      setMeUrl(userIri);

      const rawTrades = Array.isArray(tradesRes.data)
        ? tradesRes.data
        : (tradesRes.data['hydra:member'] || tradesRes.data.member || []);

      // Affiche d'abord les trades bruts (rapide)
      setAllTrades(rawTrades);
      setLoading(false);

      // Puis enrichit en arrière-plan en résolvant les IRIs (progressif)
      setEnriching(true);
      const enriched = await Promise.all(rawTrades.map(t => enrichTrade(t, token)));
      setAllTrades(enriched);

    } catch {
      Alert.alert('Erreur', 'Impossible de charger les trades');
      setLoading(false);
    } finally {
      setEnriching(false);
    }
  };

  // Sépare sent/received en comparant l'IRI du sender
  const sentTrades = meUrl
    ? allTrades.filter(t => {
        const sUrl = typeof t.sender === 'string' ? t.sender : t.sender?.['@id'];
        return sUrl && (sUrl === meUrl || sUrl.endsWith(`/${idFromUrl(meUrl)}`));
      })
    : [];

  const receivedTrades = meUrl
    ? allTrades.filter(t => {
        const sUrl = typeof t.sender === 'string' ? t.sender : t.sender?.['@id'];
        return !sUrl || (sUrl !== meUrl && !sUrl.endsWith(`/${idFromUrl(meUrl)}`));
      })
    : allTrades;

  const currentList = tab === 'sent' ? sentTrades : receivedTrades;
  const pendingReceived = receivedTrades.filter(t => t.status === 'pending').length;

  const renderItem = ({ item, index }) => (
    <TradeCard
      item={item}
      mode={tab}
      index={index}
      onPress={() => router.push({ pathname: `/trade/${item.id}`, params: { mode: tab } })}
    />
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <TradeIcon size={48} color={C.textFaint} />
      <Text style={styles.emptyTitle}>
        {tab === 'sent' ? 'Aucune proposition envoyée' : 'Aucun trade reçu'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {tab === 'sent'
          ? 'Proposez un échange depuis vos artefacts.'
          : "Vous recevrez ici les propositions d'autres joueurs."}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>

          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.topBarBtn} activeOpacity={0.7}>
              <BackIcon size={16} color={C.text} />
            </TouchableOpacity>
            <View style={styles.topBarCenter}>
              <Text style={styles.topBarTitle}>Trades</Text>
            </View>
            <TouchableOpacity
              style={styles.topBarBtnGold}
              onPress={() => router.push('/trade-new')}
              activeOpacity={0.7}
            >
              <PlusIcon size={12} color={C.bg} />
            </TouchableOpacity>
          </View>

          {/* Onglets */}
          <View style={styles.tabRow}>
            {[
              { key: 'received', label: 'Reçus', badge: pendingReceived },
              { key: 'sent',     label: 'Envoyés' },
            ].map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, tab === t.key && styles.tabActive]}
                onPress={() => setTab(t.key)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
                  {t.badge > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{t.badge}</Text>
                    </View>
                  )}
                </View>
                {tab === t.key && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            ))}
          </View>

          {!loading && currentList.length > 0 && (
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                {currentList.length} trade{currentList.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── LISTE ── */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <FlatList
            key={tab}
            data={currentList}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={ListEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.6 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  topBarBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  topBarBtnGold: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: C.gold, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'monospace' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  newTradeBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },

  // Petit point animé pendant l'enrichissement
  enrichingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.goldDim },

  tabRow: { flexDirection: 'row', paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: C.border, marginTop: 4 },
  tab: { marginRight: 24, paddingVertical: 12, position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 13, fontWeight: '500', color: C.textMuted, letterSpacing: 0.3 },
  tabTextActive: { color: C.goldLight },
  tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: C.gold, borderRadius: 1 },
  tabBadge: { backgroundColor: C.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', fontFamily: 'monospace' },

  countRow: { paddingHorizontal: 20, paddingBottom: 10 },
  countText: { fontSize: 11, color: C.textFaint, fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase' },

  listContent: { padding: 16, paddingTop: 14, flexGrow: 1 },

  tradeCard: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  tradeAccent: { width: 3, opacity: 0.8 },
  tradeInner: { flex: 1, padding: 14 },
  tradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  tradeCounterpart: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterpartAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  counterpartInitials: { fontSize: 11, fontWeight: '700', color: C.textMuted },
  counterpartLabel: { fontSize: 10, color: C.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },
  counterpartName: { fontSize: 13, fontWeight: '700', color: C.text },
  tradeHeaderRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 0.5 },
  tradeDate: { fontSize: 10, color: C.textFaint, fontFamily: 'monospace' },

  tradeExchange: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surfaceAlt, borderRadius: 8, padding: 10, marginBottom: 8 },
  tradeArtifact: { flex: 1 },
  tradeArtifactQty: { fontSize: 11, fontFamily: 'monospace', color: C.gold, fontWeight: '700', marginBottom: 2 },
  tradeArtifactName: { fontSize: 12, color: C.text, fontWeight: '600', lineHeight: 16 },
  tradeArrow: { paddingHorizontal: 4 },

  tradeMessage: { paddingTop: 4 },
  tradeMessageText: { fontSize: 11, color: C.textMuted, fontStyle: 'italic' },
  tradeCta: { marginTop: 8, alignItems: 'flex-end' },
  tradeCtaText: { fontSize: 11, color: C.gold, fontFamily: 'monospace', letterSpacing: 0.5 },

  skeleton: { height: 120, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textMuted, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: C.textFaint, textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 },
});