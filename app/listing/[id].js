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
  active:    { label: 'En vente',  color: C.accent,    bg: '#131F14' },
  sold:      { label: 'Vendu',     color: C.gold,      bg: '#2A2310' },
  cancelled: { label: 'Annulé',    color: C.textMuted, bg: C.surfaceAlt },
};

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
export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-16)).current;

  useEffect(() => { if (id) fetchListing(); }, [id]);

  const fetchListing = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/listings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListing(res.data);

      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
      ]).start();
    } catch {
      Alert.alert('Erreur', 'Impossible de charger cette annonce');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    Alert.alert('Acheter', `Acheter cette annonce pour ${listing.price} couronnes ?`, [
      { text: 'Retour', style: 'cancel' },
      {
        text: 'Acheter',
        onPress: async () => {
          setBuying(true);
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${BASE_URL}/api/listings/${id}/buy`, {}, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Succès', 'Annonce achetée !', [
              { text: 'OK', onPress: () => router.replace('/listings') },
            ]);
          } catch (err) {
            const msg = err.response?.data?.message || 'Impossible d\'acheter cette annonce';
            Alert.alert('Erreur', msg);
          } finally {
            setBuying(false);
          }
        },
      },
    ]);
  };

  const handleCancel = async () => {
    Alert.alert('Annuler l\'annonce', 'Êtes-vous sûr de vouloir retirer cette annonce ?', [
      { text: 'Retour', style: 'cancel' },
      {
        text: 'Annuler',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${BASE_URL}/api/listings/${id}/cancel`, {}, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Succès', 'L\'annonce a été retirée.', [
              { text: 'OK', onPress: () => router.replace('/listings') },
            ]);
          } catch (err) {
            const msg = err.response?.status === 403
              ? 'Vous n\'êtes pas autorisé à annuler cette annonce.'
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

  const status = listing ? (STATUS[listing.status] || STATUS.active) : null;
  const isActive = listing?.status === 'active';

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: `Annonce #${id}` }} />
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {loading ? <LoadingState /> : !listing ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Annonce introuvable</Text>
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

                {/* Artefact */}
                <View style={styles.artifactRow}>
                  <View style={styles.artifactIcon}>
                    <Text style={styles.artifactIconText}>{listing.artifact?.name?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.artifactName}>{listing.artifact?.name || '—'}</Text>
                    <Text style={styles.artifactQty}>Quantité : ×{listing.quantity}</Text>
                  </View>
                </View>

                {/* Vendeur */}
                <View style={styles.sellerRow}>
                  <Text style={styles.sellerLabel}>Vendeur</Text>
                  <View style={styles.sellerInfo}>
                    <View style={styles.sellerAvatarSmall}>
                      <Text style={styles.sellerInitialsSmall}>{listing.seller?.username?.slice(0, 2).toUpperCase() || '??'}</Text>
                    </View>
                    <Text style={styles.sellerName}>{listing.seller?.username || '—'}</Text>
                  </View>
                </View>

                {/* Dates */}
                <View style={styles.datesRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>Publiée le</Text>
                    <Text style={styles.dateValue}>{formatDate(listing.createdAt)}</Text>
                  </View>
                  {listing.resolvedAt && (
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Résolue le</Text>
                      <Text style={styles.dateValue}>{formatDate(listing.resolvedAt)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* ── PRIX ── */}
            <Section title="PRIX">
              <View style={styles.priceCard}>
                <Text style={styles.priceCardLabel}>Prix de vente</Text>
                <Text style={styles.priceCardValue}>{listing.price} 👑</Text>
              </View>
            </Section>

          </ScrollView>

          {/* ── ACTIONS ── */}
          {isActive && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.buyBtn, buying && styles.buyBtnOff]}
                onPress={handleBuy}
                disabled={buying}
              >
                {buying
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buyBtnText}>Acheter — {listing.price} 👑</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {isActive && (
            <View style={styles.cancelRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, cancelling && { opacity: 0.5 }]}
                onPress={handleCancel}
                disabled={cancelling}
              >
                {cancelling
                  ? <ActivityIndicator color={C.textMuted} />
                  : <Text style={styles.cancelBtnText}>Retirer l&apos;annonce</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

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

  priceCard: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 16, alignItems: 'center', gap: 4 },
  priceCardLabel: { fontSize: 9, color: C.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },
  priceCardValue: { fontSize: 24, fontWeight: '800', color: C.gold, fontFamily: 'monospace' },

  actions: { padding: 16, paddingBottom: 0, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  buyBtn: { backgroundColor: C.gold, borderRadius: 10, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  buyBtnOff: { opacity: 0.4 },
  buyBtnText: { fontSize: 15, fontWeight: '700', color: C.bg, letterSpacing: 0.5 },

  cancelRow: { padding: 16, paddingBottom: 24 },
  cancelBtn: { borderRadius: 10, borderWidth: 1, borderColor: C.error + '60', backgroundColor: C.surfaceAlt, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.error, letterSpacing: 0.3 },

  skeleton: { height: 18, backgroundColor: C.surface, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignSelf: 'flex-start' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, color: C.textMuted },
});
