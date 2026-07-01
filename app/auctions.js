import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  active:    { label: 'En cours',   color: C.accent,    bg: '#131F14' },
  ended:     { label: 'Terminée',   color: C.gold,      bg: '#2A2310' },
  cancelled: { label: 'Annulée',    color: C.textMuted, bg: C.surfaceAlt },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const GavelIcon = ({ size = 18, color = C.gold }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.6, height: size * 0.15, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '-45deg' }], position: 'absolute', top: size * 0.15 }} />
    <View style={{ width: size * 0.12, height: size * 0.55, backgroundColor: color, borderRadius: 1, position: 'absolute', bottom: size * 0.12 }} />
  </View>
);

const PlusIcon = ({ size = 16, color = C.bg }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size, height: 2, backgroundColor: color, position: 'absolute' }} />
    <View style={{ width: 2, height: size, backgroundColor: color, position: 'absolute' }} />
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

// ── Auction Card ──────────────────────────────────────────────────────────────
function AuctionCard({ item, index, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: Math.min(index, 5) * 70, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: Math.min(index, 5) * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const status = STATUS[item.status] || STATUS.active;

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const now = new Date();
    const diffMs = date - now;
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffH / 24);

    if (item.status === 'active' && diffH > 0) {
      if (diffD > 0) return `${diffD}j ${diffH % 24}h`;
      if (diffH > 0) return `${diffH}h`;
      return `${Math.floor(diffMs / 60000)}min`;
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <View style={styles.auctionCard}>
          <View style={[styles.auctionAccent, { backgroundColor: status.color }]} />
          <View style={styles.auctionInner}>

            {/* Header */}
            <View style={styles.auctionHeader}>
              <View style={styles.auctionSeller}>
                <View style={styles.sellerAvatar}>
                  <Text style={styles.sellerInitials}>{item.seller?.username?.slice(0, 2).toUpperCase() || '??'}</Text>
                </View>
                <View>
                  <Text style={styles.sellerLabel}>Vendeur</Text>
                  <Text style={styles.sellerName}>{item.seller?.username || '—'}</Text>
                </View>
              </View>

              <View style={styles.auctionHeaderRight}>
                <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.color + '60' }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
            </View>

            {/* Artifact */}
            <View style={styles.auctionArtifact}>
              <Text style={styles.auctionArtifactName} numberOfLines={1}>{item.artifact?.name || '—'}</Text>
              <Text style={styles.auctionArtifactQty}>×{item.quantity}</Text>
            </View>

            {/* Price row */}
            <View style={styles.priceRow}>
              <View style={styles.priceCol}>
                <Text style={styles.priceLabel}>Prix de départ</Text>
                <Text style={styles.priceValue}>{item.startingPrice} 👑</Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.priceLabel}>Enchère la plus haute</Text>
                <Text style={[styles.priceValue, { color: C.goldLight }]}>{item.currentHighestBid} 👑</Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.priceLabel}>Enchères</Text>
                <Text style={styles.priceValue}>{item.bidCount}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.auctionFooter}>
              <View style={styles.timeLeft}>
                <Text style={styles.timeLabel}>Se termine dans</Text>
                <Text style={[styles.timeValue, item.status !== 'active' && { color: C.textFaint }]}>
                  {item.status === 'active' ? formatDate(item.endAt) : '—'}
                </Text>
              </View>
              {item.status === 'active' && item.minNextBidAmount > 0 && (
                <Text style={styles.minBid}>Min. prochaine enchère : {item.minNextBidAmount} 👑</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const MemoizedAuctionCard = React.memo(AuctionCard);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AuctionsScreen() {
  const router = useRouter();
  const [auctions, setAuctions] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const isLoadingRef = useRef(false);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    fetchAuctions(1);
  }, []);

  const fetchAuctions = async (pageNum) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/auctions?page=${pageNum}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data) ? res.data : (res.data['hydra:member'] || res.data.member || []);

      if (pageNum === 1) {
        setAuctions(data);
        setHasMore(data.length > 0);
      } else {
        setAuctions(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const toAdd = data.filter(a => !existingIds.has(a.id));
          setHasMore(toAdd.length > 0);
          return [...prev, ...toAdd];
        });
      }
      setPage(pageNum);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les enchères');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const loadMore = () => {
    if (!isLoadingRef.current && hasMore) {
      fetchAuctions(page + 1);
    }
  };

  const renderItem = ({ item, index }) => (
    <MemoizedAuctionCard
      item={item}
      index={index}
      onPress={() => router.push(`/auction/${item.id}`)}
    />
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <GavelIcon size={48} color={C.textFaint} />
      <Text style={styles.emptyTitle}>Aucune enchère</Text>
      <Text style={styles.emptySubtitle}>Il n&apos;y a pas d&apos;enchères en cours pour le moment.</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Enchères',
          headerRight: () => (
            <TouchableOpacity
              style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
              onPress={() => router.push('/auction-new')}
            >
              <PlusIcon size={12} color={C.bg} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View style={styles.headerTopLine} />
          {!loading && auctions.length > 0 && (
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                {auctions.length} enchère{auctions.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </Animated.View>

        {loading && auctions.length === 0 ? (
          <LoadingSkeleton />
        ) : (
          <FlatList
            data={auctions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={ListEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            removeClippedSubviews={false}
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

  countRow: { paddingHorizontal: 20, paddingVertical: 10 },
  countText: { fontSize: 11, color: C.textFaint, fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase' },

  listContent: { padding: 16, paddingTop: 14, flexGrow: 1 },

  auctionCard: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  auctionAccent: { width: 3, opacity: 0.8 },
  auctionInner: { flex: 1, padding: 14 },
  auctionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  auctionSeller: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sellerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  sellerInitials: { fontSize: 11, fontWeight: '700', color: C.textMuted },
  sellerLabel: { fontSize: 10, color: C.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },
  sellerName: { fontSize: 13, fontWeight: '700', color: C.text },

  auctionHeaderRight: { alignItems: 'flex-end' },
  statusBadge: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 0.5 },

  auctionArtifact: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surfaceAlt, borderRadius: 8, padding: 10, marginBottom: 10 },
  auctionArtifactName: { flex: 1, fontSize: 13, fontWeight: '700', color: C.text },
  auctionArtifactQty: { fontSize: 12, fontFamily: 'monospace', color: C.gold, fontWeight: '700' },

  priceRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  priceCol: { flex: 1 },
  priceLabel: { fontSize: 9, color: C.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  priceValue: { fontSize: 13, fontWeight: '700', color: C.gold },

  auctionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  timeLeft: { gap: 2 },
  timeLabel: { fontSize: 9, color: C.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeValue: { fontSize: 13, fontWeight: '700', color: C.accent },
  minBid: { fontSize: 10, color: C.goldDim, fontFamily: 'monospace' },

  skeleton: { height: 140, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textMuted, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: C.textFaint, textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 },
});
