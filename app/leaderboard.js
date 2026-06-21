import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';

// ── Palette ───────────────────────────────────────────────────────────────────
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
  silver: '#A8A8B0',
  bronze: '#A0643C',
};

const MEDAL = [
  { color: C.gold,   label: '1er',  bg: '#2A2310' },
  { color: C.silver, label: '2ème', bg: '#1E1E22' },
  { color: C.bronze, label: '3ème', bg: '#221A14' },
];

// ── Icônes ────────────────────────────────────────────────────────────────────
const BackIcon = ({ size = 16, color = C.text }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '-45deg' }, { translateY: 3 }] }} />
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }, { translateY: -3 }] }} />
    <View style={{ width: size * 0.75, height: 1.5, backgroundColor: color }} />
  </View>
);

const CrownIcon = ({ size = 13, color = C.gold }) => (
  <View style={{ width: size, height: size * 0.85, alignItems: 'center', justifyContent: 'flex-end' }}>
    <View style={{ width: size, height: size * 0.45, borderLeftWidth: size * 0.12, borderRightWidth: size * 0.12, borderBottomWidth: size * 0.45, borderColor: 'transparent', borderBottomColor: color, position: 'absolute', bottom: 0 }} />
    {[-1, 0, 1].map((o, i) => (
      <View key={i} style={{ position: 'absolute', bottom: size * 0.35, left: size * 0.5 + o * size * 0.32 - size * 0.07, width: size * 0.14, height: size * 0.14, borderRadius: size * 0.07, backgroundColor: color }} />
    ))}
  </View>
);

const MapPinIcon = ({ size = 12, color = C.accent }) => (
  <View style={{ width: size, height: size * 1.3, alignItems: 'center' }}>
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color }} />
    <View style={{ width: 1.5, height: size * 0.4, backgroundColor: color }} />
  </View>
);

const TrophyIcon = ({ size = 22, color = C.gold }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.72, height: size * 0.62, borderRadius: 3, borderWidth: 1.8, borderColor: color, borderBottomWidth: 0 }} />
    <View style={{ width: size * 0.38, height: 2, backgroundColor: color, marginTop: -1 }} />
    <View style={{ width: size * 0.55, height: 1.8, backgroundColor: color }} />
    <View style={{ width: size * 0.3, height: size * 0.22, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: color, marginTop: -1 }} />
  </View>
);

// ── Podium bar (top 3) ────────────────────────────────────────────────────────
function PodiumCard({ player, rank, totalPlayers }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 8, delay: rank * 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: rank * 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const medal = MEDAL[rank];
  const isFirst = rank === 0;
  const initials = player.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <Animated.View style={[
      styles.podiumCard,
      { backgroundColor: medal.bg, borderColor: medal.color + '50', opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      isFirst && styles.podiumCardFirst,
    ]}>
      {isFirst && <View style={styles.podiumGlow} />}

      {/* Rank badge */}
      <View style={[styles.podiumRankBadge, { borderColor: medal.color }]}>
        <Text style={[styles.podiumRankText, { color: medal.color }]}>{rank + 1}</Text>
      </View>

      {/* Avatar */}
      <View style={[styles.podiumAvatar, { borderColor: medal.color }]}>
        <Text style={[styles.podiumInitials, { color: medal.color }]}>{initials}</Text>
      </View>

      <Text style={styles.podiumName} numberOfLines={1}>{player.username}</Text>

      {/* Stats */}
      <View style={styles.podiumStats}>
        <View style={styles.podiumStat}>
          <CrownIcon size={11} color={C.gold} />
          <Text style={styles.podiumStatVal}>{player.crowns}</Text>
        </View>
        <View style={styles.podiumStatDot} />
        <View style={styles.podiumStat}>
          <MapPinIcon size={10} color={C.accent} />
          <Text style={styles.podiumStatVal}>{player.completedHuntsCount}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Regular row ───────────────────────────────────────────────────────────────
function PlayerRow({ item, rank, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const initials = item.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.row}>
        <View style={styles.rowAccentBar} />
        <View style={styles.rowInner}>
          {/* Rank */}
          <View style={styles.rowRank}>
            <Text style={styles.rowRankText}>#{rank}</Text>
          </View>

          {/* Avatar */}
          <View style={styles.rowAvatar}>
            <Text style={styles.rowInitials}>{initials}</Text>
          </View>

          {/* Info */}
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>{item.username}</Text>
            <View style={styles.rowStats}>
              <CrownIcon size={11} color={C.goldDim} />
              <Text style={styles.rowStatText}>{item.crowns}</Text>
              <View style={styles.rowStatSep} />
              <MapPinIcon size={10} color={C.accent} />
              <Text style={styles.rowStatText}>{item.completedHuntsCount}</Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingState() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ padding: 16, gap: 10 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Animated.View key={i} style={[styles.skeleton, { opacity: pulse }]} />
      ))}
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Token manquant');
      const response = await axios.get(
        'https://lootopia-test.ordwen-dev.com/api/participants/top',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlayers(response.data || []);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le classement');
    } finally {
      setLoading(false);
    }
  };

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  const renderRow = ({ item, index }) => (
    <PlayerRow item={item} rank={index + 4} index={index} />
  );

  const ListHeader = () => (
    <>
      {/* Podium */}
      {top3.length > 0 && (
        <View style={styles.podiumSection}>
          <View style={styles.podiumRow}>
            {/* 2nd (left) */}
            {top3[1] && <PodiumCard player={top3[1]} rank={1} />}
            {/* 1st (center, taller) */}
            {top3[0] && (
              <View style={styles.podiumCenter}>
                <PodiumCard player={top3[0]} rank={0} />
              </View>
            )}
            {/* 3rd (right) */}
            {top3[2] && <PodiumCard player={top3[2]} rank={2} />}
          </View>
        </View>
      )}

      {/* Section label */}
      {rest.length > 0 && (
        <View style={styles.restHeader}>
          <View style={styles.dividerLine} />
          <Text style={styles.restHeaderText}>CLASSEMENT</Text>
          <View style={styles.dividerLine} />
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── CONTENT ── */}
      {loading ? (
        <LoadingState />
      ) : players.length === 0 ? (
        <View style={styles.emptyContainer}>
          <TrophyIcon size={48} color={C.textFaint} />
          <Text style={styles.emptyTitle}>Aucun joueur classé</Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderRow}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.6 },
  headerContent: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  countBadge: {
    backgroundColor: C.surfaceAlt, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  countText: { fontSize: 12, color: C.textMuted, fontFamily: 'monospace' },

  // Podium
  podiumSection: { paddingTop: 24, paddingHorizontal: 12, paddingBottom: 8 },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8 },
  podiumCenter: { marginBottom: 12 },
  podiumCard: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    padding: 12, alignItems: 'center', gap: 6,
    overflow: 'hidden', position: 'relative',
  },
  podiumCardFirst: { paddingTop: 16, paddingBottom: 16 },
  podiumGlow: {
    position: 'absolute', top: -20, left: '50%',
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.gold, opacity: 0.06,
    transform: [{ translateX: -40 }],
  },
  podiumRankBadge: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  podiumRankText: { fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },
  podiumAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.bg, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  podiumInitials: { fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  podiumName: {
    fontSize: 12, fontWeight: '700', color: C.text,
    letterSpacing: 0.3, textAlign: 'center',
  },
  podiumStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  podiumStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  podiumStatVal: { fontSize: 11, color: C.textMuted, fontFamily: 'monospace' },
  podiumStatDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textFaint },

  // Rest header
  restHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 8, marginBottom: 14, gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  restHeaderText: {
    fontSize: 10, fontWeight: '700', color: C.textFaint,
    letterSpacing: 2, fontFamily: 'monospace',
  },

  // Row
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  row: {
    backgroundColor: C.surface, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', overflow: 'hidden',
  },
  rowAccentBar: { width: 3, backgroundColor: C.border },
  rowInner: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  rowRank: {
    width: 32, alignItems: 'center',
  },
  rowRankText: {
    fontSize: 11, color: C.textFaint,
    fontFamily: 'monospace', fontWeight: '700',
  },
  rowAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  rowInitials: { fontSize: 13, fontWeight: '700', color: C.textMuted, letterSpacing: 0.5 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: C.text, letterSpacing: 0.2 },
  rowStats: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  rowStatText: { fontSize: 11, color: C.textFaint, fontFamily: 'monospace' },
  rowStatSep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textFaint },

  // Loading
  skeleton: {
    height: 58, backgroundColor: C.surface,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 15, color: C.textMuted },
});