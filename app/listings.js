import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BASE_URL = 'https://lootopia-test.ordwen-dev.com';
const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 48) / 2;

const C = {
  bg: '#0E0C09',
  bgDeep: '#060503',
  surface: '#1A1710',
  surfaceAlt: '#211E14',
  surfaceLight: '#231E13',
  border: '#2E2B1E',
  borderLight: '#3D3520',
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  goldBright: '#F5DFA0',
  goldDim: '#7A6128',
  goldDark: '#4A3A18',
  text: '#EDE8D8',
  textMuted: '#8A8470',
  textFaint: '#504C3D',
  accent: '#5C8A5E',
  error: '#C0504A',
  legendary: '#A855F7',
  epic: '#6366F1',
  rare: '#3B82F6',
};

const STATUS = {
  active:    { label: 'En vente',  color: C.accent,   bg: '#0F1A10', glow: C.accent + '30' },
  sold:      { label: 'Vendu',     color: C.gold,     bg: '#1A1608', glow: C.gold + '30' },
  cancelled: { label: 'Annulé',    color: C.textMuted, bg: C.surfaceAlt, glow: 'transparent' },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const ShopIcon = ({ size = 32, color = C.gold }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.85, height: size * 0.15, backgroundColor: color, borderRadius: 2, position: 'absolute', top: size * 0.08 }} />
    <View style={{ width: size * 0.65, height: size * 0.6, borderTopWidth: 2, borderTopColor: color, borderLeftWidth: 2, borderLeftColor: color, borderRightWidth: 2, borderRightColor: color, marginTop: size * 0.2 }} />
    <View style={{ width: size * 0.25, height: 2, backgroundColor: C.bg, position: 'absolute', bottom: size * 0.18 }} />
    <View style={{ width: size * 0.25, height: 2, backgroundColor: C.bg, position: 'absolute', bottom: size * 0.1 }} />
  </View>
);

const SearchIcon = ({ size = 16, color = C.textMuted }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, borderWidth: 1.5, borderColor: color }} />
    <View style={{ width: 1.5, height: size * 0.3, backgroundColor: color, transform: [{ rotate: '45deg' }], position: 'absolute', bottom: 0, right: size * 0.05 }} />
  </View>
);

const CoinIcon = ({ size = 14, color = C.gold }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: 1, borderColor: C.goldDim, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.35, height: size * 0.35, borderRadius: size * 0.175, borderWidth: 1, borderColor: C.goldDim }} />
  </View>
);

const FilterIcon = ({ size = 16, color = C.textMuted }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.8, height: 1.5, backgroundColor: color, marginBottom: 3 }} />
    <View style={{ width: size * 0.55, height: 1.5, backgroundColor: color, marginBottom: 3 }} />
    <View style={{ width: size * 0.3, height: 1.5, backgroundColor: color }} />
  </View>
);

// ── Header Banner ─────────────────────────────────────────────────────────────
function HeaderBanner({ count, loading }) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.banner}>
      <View style={styles.bannerBg}>
        <View style={styles.bannerPattern1} />
        <View style={styles.bannerPattern2} />
        <View style={styles.bannerPattern3} />
      </View>
      <View style={styles.bannerContent}>
        <Animated.View style={[styles.bannerIconWrap, { opacity: pulseAnim }]}>
          <ShopIcon size={36} color={C.gold} />
        </Animated.View>
        <Text style={styles.bannerTitle}>Hôtel des Ventes</Text>
        <Text style={styles.bannerSubtitle}>Marché aux enchères de Lootopia</Text>
        {!loading && (
          <View style={styles.bannerCount}>
            <View style={styles.bannerCountDot} />
            <Text style={styles.bannerCountText}>
              {count} article{count !== 1 ? 's' : ''} en vente
            </Text>
          </View>
        )}
      </View>
      <View style={styles.bannerBottomBorder}>
        <Animated.View style={[styles.bannerBottomGlow, { opacity: glowAnim }]} />
      </View>
    </View>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
function FilterBar({ searchQuery, onSearchChange, activeFilter, onFilterChange }) {
  const filters = [
    { key: 'all', label: 'Tout' },
    { key: 'active', label: 'En vente' },
    { key: 'sold', label: 'Vendu' },
  ];

  return (
    <View style={styles.filterBar}>
      <View style={styles.searchWrap}>
        <View style={styles.searchIconWrap}><SearchIcon size={14} color={C.goldDim} /></View>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un objet..."
          placeholderTextColor={C.textFaint}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={styles.filterChips}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => onFilterChange(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  const pulse = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.7, duration: 800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Animated.View key={i} style={[styles.skeletonCard, { opacity: pulse }]}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonLine1} />
          <View style={styles.skeletonLine2} />
        </Animated.View>
      ))}
    </View>
  );
}

// ── Listing Card (HDV Style) ─────────────────────────────────────────────────
function ListingCard({ item, index, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: Math.min(index, 8) * 50, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, delay: Math.min(index, 8) * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const status = STATUS[item.status] || STATUS.active;
  const isActive = item.status === 'active';
  const initial = item.artifact?.name?.[0]?.toUpperCase() || '?';

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.itemCard}>
        {/* Glow border for active items */}
        {isActive && <View style={[styles.itemCardGlow, { borderColor: status.color + '40' }]} />}

        <View style={styles.itemCardInner}>
          {/* Item Image / Icon Area */}
          <View style={[styles.itemImage, isActive && { borderColor: C.goldDim + '60' }]}>
            <View style={styles.itemImageBg}>
              <Text style={styles.itemImageInitial}>{initial}</Text>
            </View>
            {/* Quantity badge */}
            {item.quantity > 1 && (
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyBadgeText}>×{item.quantity}</Text>
              </View>
            )}
            {/* Status ribbon */}
            <View style={[styles.statusRibbon, { backgroundColor: status.bg }]}>
              <View style={[styles.statusRibbonDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusRibbonText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          {/* Item Info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>{item.artifact?.name || '—'}</Text>

            {/* Seller */}
            <View style={styles.itemSeller}>
              <View style={styles.itemSellerDot} />
              <Text style={styles.itemSellerText}>{item.seller?.username || '—'}</Text>
            </View>
          </View>

          {/* Price Tag */}
          <View style={[styles.priceTag, !isActive && styles.priceTagSold]}>
            <CoinIcon size={12} color={isActive ? C.gold : C.textFaint} />
            <Text style={[styles.priceTagText, !isActive && { color: C.textFaint }]}>{item.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const MemoizedListingCard = React.memo(ListingCard);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ListingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const isLoadingRef = useRef(false);

  useEffect(() => { fetchListings(1); }, []);

  // Apply filters
  useEffect(() => {
    let result = [...listings];
    if (activeFilter !== 'all') {
      result = result.filter(l => l.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.artifact?.name?.toLowerCase().includes(q) ||
        l.seller?.username?.toLowerCase().includes(q)
      );
    }
    setFilteredListings(result);
  }, [listings, activeFilter, searchQuery]);

  const fetchListings = async (pageNum) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/listings?page=${pageNum}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data) ? res.data : (res.data['hydra:member'] || res.data.member || []);

      if (pageNum === 1) {
        setListings(data);
        setHasMore(data.length > 0);
      } else {
        setListings(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const toAdd = data.filter(a => !existingIds.has(a.id));
          setHasMore(toAdd.length > 0);
          return [...prev, ...toAdd];
        });
      }
      setPage(pageNum);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le marché');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const loadMore = () => {
    if (!isLoadingRef.current && hasMore) {
      fetchListings(page + 1);
    }
  };

  const renderItem = ({ item, index }) => (
    <MemoizedListingCard
      item={item}
      index={index}
      onPress={() => router.push(`/listing/${item.id}`)}
    />
  );

  const ListHeader = () => (
    <>
      <HeaderBanner count={filteredListings.length} loading={loading} />
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <ShopIcon size={56} color={C.textFaint} />
      </View>
      <Text style={styles.emptyTitle}>Le marché est vide</Text>
      <Text style={styles.emptySubtitle}>Aucun objet n&apos;est actuellement en vente</Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => router.push('/listing-new')}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyBtnText}>Poster une annonce</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        {/* Custom HDV Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.topBarBtn} activeOpacity={0.7}>
            <Text style={styles.topBarBack}>‹</Text>
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle}>Marché</Text>
          </View>
          <TouchableOpacity
            style={styles.topBarBtn}
            onPress={() => router.push('/listing-new')}
            activeOpacity={0.7}
          >
            <Text style={styles.topBarPlus}>+</Text>
          </TouchableOpacity>
        </View>

        {loading && listings.length === 0 ? (
          <LoadingSkeleton />
        ) : (
          <FlatList
            data={filteredListings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmpty}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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

  // ── Top Bar ──
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  topBarBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  topBarBack: { fontSize: 20, color: C.text, fontWeight: '300', marginTop: -2 },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: C.gold, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'monospace' },
  topBarPlus: { fontSize: 20, color: C.gold, fontWeight: '700', lineHeight: 24 },

  // ── Banner ──
  banner: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, overflow: 'hidden' },
  bannerBg: { ...StyleSheet.absoluteFillObject },
  bannerPattern1: { position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: C.goldDim + '15' },
  bannerPattern2: { position: 'absolute', bottom: -30, left: -15, width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: C.goldDim + '10' },
  bannerPattern3: { position: 'absolute', top: 10, left: 40, width: 200, height: 1, backgroundColor: C.goldDim + '20' },
  bannerContent: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  bannerIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.goldDark + '40', borderWidth: 1, borderColor: C.goldDim + '40', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: C.gold, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'monospace' },
  bannerSubtitle: { fontSize: 11, color: C.textMuted, marginTop: 4, letterSpacing: 1 },
  bannerCount: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: C.surfaceAlt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  bannerCountDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  bannerCountText: { fontSize: 11, color: C.textMuted, fontFamily: 'monospace', letterSpacing: 0.5 },
  bannerBottomBorder: { height: 3, backgroundColor: C.goldDim + '30', overflow: 'hidden' },
  bannerBottomGlow: { flex: 1, backgroundColor: C.gold, opacity: 0.6 },

  // ── Filter Bar ──
  filterBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 10 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 42, gap: 8 },
  searchIconWrap: { width: 20, alignItems: 'center' },
  searchInput: { flex: 1, fontSize: 13, color: C.text },
  filterChips: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.goldDark + '40', borderColor: C.goldDim },
  filterChipText: { fontSize: 11, fontWeight: '600', color: C.textMuted, fontFamily: 'monospace', letterSpacing: 0.5 },
  filterChipTextActive: { color: C.gold },

  // ── Grid ──
  listContent: { paddingBottom: 24 },
  row: { justifyContent: 'space-between', paddingHorizontal: 16, gap: 12 },

  // ── Item Card ──
  itemCard: { width: CARD_W, marginBottom: 12, position: 'relative' },
  itemCardGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 12, borderWidth: 1 },
  itemCardInner: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },

  // Image Area
  itemImage: { height: CARD_W * 0.7, backgroundColor: C.surfaceAlt, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  itemImageBg: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.goldDark + '30', borderWidth: 1, borderColor: C.goldDim + '40', alignItems: 'center', justifyContent: 'center' },
  itemImageInitial: { fontSize: 22, fontWeight: '800', color: C.gold, fontFamily: 'monospace' },

  qtyBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: C.goldDark + 'CC', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.goldDim + '60' },
  qtyBadgeText: { fontSize: 10, fontWeight: '800', color: C.goldLight, fontFamily: 'monospace' },

  statusRibbon: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  statusRibbonDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusRibbonText: { fontSize: 9, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase' },

  // Info
  itemInfo: { padding: 10, gap: 4 },
  itemName: { fontSize: 12, fontWeight: '700', color: C.text, lineHeight: 16 },
  itemSeller: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemSellerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.textFaint },
  itemSellerText: { fontSize: 10, color: C.textFaint, fontFamily: 'monospace' },

  // Price
  priceTag: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginHorizontal: 10, marginBottom: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: C.goldDark + '25', borderWidth: 1, borderColor: C.goldDim + '30' },
  priceTagSold: { backgroundColor: C.surfaceAlt, borderColor: C.border },
  priceTagText: { fontSize: 13, fontWeight: '800', color: C.gold, fontFamily: 'monospace', letterSpacing: 0.5 },

  // ── Skeleton ──
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  skeletonCard: { width: CARD_W, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 12 },
  skeletonImage: { height: CARD_W * 0.7, backgroundColor: C.surfaceAlt },
  skeletonLine1: { height: 10, backgroundColor: C.surfaceAlt, borderRadius: 5, marginHorizontal: 10, marginTop: 10, width: '60%' },
  skeletonLine2: { height: 8, backgroundColor: C.surfaceAlt, borderRadius: 4, marginHorizontal: 10, marginTop: 6, marginBottom: 10, width: '40%' },

  // ── Empty ──
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 16, paddingHorizontal: 40 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.textMuted },
  emptySubtitle: { fontSize: 13, color: C.textFaint, textAlign: 'center', lineHeight: 18 },
  emptyBtn: { marginTop: 8, backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: C.bg, letterSpacing: 0.5 },
});
