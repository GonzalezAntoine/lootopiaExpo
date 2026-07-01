import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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

const STATUS = {
  active:    { label: 'En cours',   color: C.accent,    bg: '#131F14' },
  ended:     { label: 'Terminée',   color: C.gold,      bg: '#2A2310' },
  cancelled: { label: 'Annulée',    color: C.textMuted, bg: C.surfaceAlt },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const BackIcon = ({ size = 16, color = C.text }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '-45deg' }, { translateY: 3 }] }} />
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }, { translateY: -3 }] }} />
    <View style={{ width: size * 0.75, height: 1.5, backgroundColor: color }} />
  </View>
);

const GavelIcon = ({ size = 16, color = C.gold }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.6, height: size * 0.15, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '-45deg' }], position: 'absolute', top: size * 0.15 }} />
    <View style={{ width: size * 0.12, height: size * 0.55, backgroundColor: color, borderRadius: 1, position: 'absolute', bottom: size * 0.12 }} />
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

// ── Section ───────────────────────────────────────────────────────────────────
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
export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-16)).current;

  useEffect(() => { if (id) fetchAuction(); }, [id]);

  const fetchAuction = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/auctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuction(res.data);

      if (res.data.minNextBidAmount > 0) {
        setBidAmount(String(res.data.minNextBidAmount));
      }

      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
      ]).start();
    } catch {
      Alert.alert('Erreur', 'Impossible de charger cette enchère');
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }

    if (auction.minNextBidAmount > 0 && amount < auction.minNextBidAmount) {
      Alert.alert('Erreur', `L'enchère minimum est de ${auction.minNextBidAmount} couronnes`);
      return;
    }

    Alert.alert('Confirmer l\'enchère', `Enchérir ${amount} couronnes ?`, [
      { text: 'Retour', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          setBidding(true);
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${BASE_URL}/api/auctions/${id}/bid`, { amount }, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Succès', 'Votre enchère a été placée !');
            fetchAuction();
          } catch (err) {
            const msg = err.response?.data?.message || 'Impossible de placer cette enchère';
            Alert.alert('Erreur', msg);
          } finally {
            setBidding(false);
          }
        },
      },
    ]);
  };

  const handleCancel = async () => {
    Alert.alert('Annuler l\'enchère', 'Êtes-vous sûr de vouloir annuler cette enchère ?', [
      { text: 'Retour', style: 'cancel' },
      {
        text: 'Annuler l\'enchère',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${BASE_URL}/api/auctions/${id}/cancel`, {}, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Succès', 'L\'enchère a été annulée.', [
              { text: 'OK', onPress: () => router.replace('/auctions') },
            ]);
          } catch (err) {
            const msg = err.response?.status === 403
              ? "Vous n'êtes pas autorisé à annuler cette enchère."
              : err.response?.data?.message || 'Une erreur est survenue.';
            Alert.alert('Erreur', msg);
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatCountdown = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const now = new Date();
    const diffMs = date - now;
    if (diffMs <= 0) return 'Terminée';
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffH / 24);
    const diffM = Math.floor((diffMs % 3600000) / 60000);
    if (diffD > 0) return `${diffD}j ${diffH % 24}h ${diffM}min`;
    if (diffH > 0) return `${diffH}h ${diffM}min`;
    return `${diffM}min`;
  };

  const status = auction ? (STATUS[auction.status] || STATUS.active) : null;
  const isActive = auction?.status === 'active';

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: `Enchère #${id}` }} />
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {loading ? <LoadingState /> : !auction ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Enchère introuvable</Text>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* ── HERO ── */}
            <Animated.View style={[styles.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
              <View style={styles.heroTopLine} />
              <View style={styles.heroInner}>

                {/* Statut */}
                <View style={[styles.statusBadgeLarge, { backgroundColor: status.bg, borderColor: status.color + '60' }]}>
                  <Text style={[styles.statusTextLarge, { color: status.color }]}>{status.label}</Text>
                </View>

                {/* Artfact */}
                <View style={styles.artifactRow}>
                  <View style={styles.artifactIcon}>
                    <Text style={styles.artifactIconText}>{auction.artifact?.name?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.artifactName}>{auction.artifact?.name || '—'}</Text>
                    <Text style={styles.artifactQty}>Quantité : ×{auction.quantity}</Text>
                  </View>
                </View>

                {/* Vendeur */}
                <View style={styles.sellerRow}>
                  <Text style={styles.sellerLabel}>Vendeur</Text>
                  <View style={styles.sellerInfo}>
                    <View style={styles.sellerAvatarSmall}>
                      <Text style={styles.sellerInitialsSmall}>{auction.seller?.username?.slice(0, 2).toUpperCase() || '??'}</Text>
                    </View>
                    <Text style={styles.sellerName}>{auction.seller?.username || '—'}</Text>
                  </View>
                </View>

                {/* Dates */}
                <View style={styles.datesRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>Créée le</Text>
                    <Text style={styles.dateValue}>{formatDate(auction.createdAt)}</Text>
                  </View>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>Se termine le</Text>
                    <Text style={[styles.dateValue, isActive && { color: C.accent }]}>
                      {formatDate(auction.endAt)}
                    </Text>
                  </View>
                </View>
                {auction.resolvedAt && (
                  <View style={styles.datesRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Résolue le</Text>
                      <Text style={styles.dateValue}>{formatDate(auction.resolvedAt)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* ── PRIX ── */}
            <Section title="PRIX">
              <View style={styles.priceCards}>
                <View style={styles.priceCard}>
                  <Text style={styles.priceCardLabel}>Prix de départ</Text>
                  <Text style={styles.priceCardValue}>{auction.startingPrice} 👑</Text>
                </View>
                <View style={[styles.priceCard, { borderColor: C.goldDim }]}>
                  <Text style={styles.priceCardLabel}>Enchère la plus haute</Text>
                  <Text style={[styles.priceCardValue, { color: C.goldLight }]}>{auction.currentHighestBid} 👑</Text>
                </View>
              </View>
              <View style={styles.priceCards}>
                <View style={styles.priceCard}>
                  <Text style={styles.priceCardLabel}>Nombre d'enchères</Text>
                  <Text style={styles.priceCardValue}>{auction.bidCount}</Text>
                </View>
                <View style={styles.priceCard}>
                  <Text style={styles.priceCardLabel}>Prochaine enchère min.</Text>
                  <Text style={styles.priceCardValue}>{auction.minNextBidAmount} 👑</Text>
                </View>
              </View>
            </Section>

            {/* ── MEILLEUR ENCHÉRISSEUR ── */}
            {auction.currentBidder && (
              <Section title="MEILLEUR ENCHÉRISSEUR">
                <View style={styles.bidderCard}>
                  <View style={styles.bidderAvatar}>
                    <Text style={styles.bidderInitials}>{auction.currentBidder.username?.slice(0, 2).toUpperCase() || '??'}</Text>
                  </View>
                  <Text style={styles.bidderName}>{auction.currentBidder.username}</Text>
                </View>
              </Section>
            )}

            {/* ── TEMPS RESTANT ── */}
            {isActive && (
              <Section title="TEMPS RESTANT">
                <View style={styles.countdownCard}>
                  <Text style={styles.countdownValue}>{formatCountdown(auction.endAt)}</Text>
                </View>
              </Section>
            )}

          </ScrollView>

          {/* ── ACTIONS ── */}
          {isActive && (
            <View style={styles.actions}>
              <View style={styles.bidRow}>
                <TextInput
                  style={styles.bidInput}
                  placeholder={`Min. ${auction.minNextBidAmount}`}
                  placeholderTextColor={C.textFaint}
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={[styles.bidBtn, bidding && styles.bidBtnOff]}
                  onPress={handleBid}
                  disabled={bidding}
                >
                  {bidding
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.bidBtnText}>Enchérir</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── CANCEL (si vendeur) ── */}
          {isActive && (
            <View style={styles.cancelRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, cancelling && { opacity: 0.5 }]}
                onPress={handleCancel}
                disabled={cancelling}
              >
                {cancelling
                  ? <ActivityIndicator color={C.textMuted} />
                  : <Text style={styles.cancelBtnText}>Annuler l'enchère</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
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
  auctionIdBadge: { backgroundColor: C.surfaceAlt, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 6 },
  auctionIdText: { fontSize: 11, color: C.goldDim, fontFamily: 'monospace', letterSpacing: 1 },

  scrollContent: { paddingBottom: 24 },

  hero: { margin: 16, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  heroTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.5 },
  heroInner: { padding: 16, gap: 14 },

  statusBadgeLarge: { alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusTextLarge: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1 },

  artifactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surfaceAlt, borderRadius: 10, padding: 12 },
  artifactIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.goldDim + '30', borderWidth: 1, borderColor: C.goldDim + '60', alignItems: 'center', justifyContent: 'center' },
  artifactIconText: { fontSize: 18, fontWeight: '800', color: C.gold },
  artifactName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  artifactQty: { fontSize: 12, color: C.textMuted, fontFamily: 'monospace' },

  sellerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sellerLabel: { fontSize: 11, color: C.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sellerAvatarSmall: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  sellerInitialsSmall: { fontSize: 9, fontWeight: '700', color: C.textMuted },
  sellerName: { fontSize: 12, fontWeight: '700', color: C.text },

  datesRow: { flexDirection: 'row', gap: 12 },
  dateCol: { flex: 1, gap: 2 },
  dateLabel: { fontSize: 9, color: C.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: 11, color: C.textMuted, fontFamily: 'monospace' },

  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: C.textMuted, fontFamily: 'monospace', letterSpacing: 2 },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.border },

  priceCards: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  priceCard: { flex: 1, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center', gap: 4 },
  priceCardLabel: { fontSize: 9, color: C.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },
  priceCardValue: { fontSize: 16, fontWeight: '700', color: C.gold, fontFamily: 'monospace' },

  bidderCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim + '60', padding: 14 },
  bidderAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.goldDim + '30', borderWidth: 1, borderColor: C.goldDim, alignItems: 'center', justifyContent: 'center' },
  bidderInitials: { fontSize: 12, fontWeight: '700', color: C.gold },
  bidderName: { fontSize: 14, fontWeight: '700', color: C.text },

  countdownCard: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.accent + '60', padding: 16, alignItems: 'center' },
  countdownValue: { fontSize: 22, fontWeight: '800', color: C.accent, fontFamily: 'monospace', letterSpacing: 1 },

  actions: { padding: 16, paddingBottom: 0, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  bidRow: { flexDirection: 'row', gap: 10 },
  bidInput: { flex: 1, backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 48, fontSize: 15, color: C.text, fontFamily: 'monospace', fontWeight: '700' },
  bidBtn: { backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 24, height: 48, alignItems: 'center', justifyContent: 'center' },
  bidBtnOff: { opacity: 0.4 },
  bidBtnText: { fontSize: 15, fontWeight: '700', color: C.bg, letterSpacing: 0.5 },

  cancelRow: { padding: 16, paddingBottom: 24 },
  cancelBtn: { borderRadius: 10, borderWidth: 1, borderColor: C.error + '60', backgroundColor: C.surfaceAlt, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.error, letterSpacing: 0.3 },

  skeleton: { height: 18, backgroundColor: C.surface, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignSelf: 'flex-start' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, color: C.textMuted },
});
