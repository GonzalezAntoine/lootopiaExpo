import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// ── Palette (même que HuntsScreen) ───────────────────────────────────────────
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
};

// ── Mini icônes ───────────────────────────────────────────────────────────────
const BackIcon = ({ size = 16, color = C.text }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '-45deg' }, { translateY: 3 }] }} />
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }, { translateY: -3 }] }} />
    <View style={{ width: size * 0.75, height: 1.5, backgroundColor: color }} />
  </View>
);

const CrownIcon = ({ size = 20, color = C.gold }) => (
  <View style={{ width: size, height: size * 0.85, alignItems: 'center', justifyContent: 'flex-end' }}>
    {/* base */}
    <View style={{ width: size, height: size * 0.45, backgroundColor: 'transparent', borderLeftWidth: size * 0.12, borderRightWidth: size * 0.12, borderBottomWidth: size * 0.45, borderColor: 'transparent', borderBottomColor: color, position: 'absolute', bottom: 0 }} />
    {/* points */}
    {[-1, 0, 1].map((offset, i) => (
      <View key={i} style={{
        position: 'absolute',
        bottom: size * 0.35,
        left: size * 0.5 + offset * size * 0.32 - size * 0.07,
        width: size * 0.14, height: size * 0.14,
        borderRadius: size * 0.07,
        backgroundColor: color,
      }} />
    ))}
  </View>
);

const ShieldIcon = ({ size = 18, color = C.gold }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: size * 0.75, height: size * 0.85,
      borderTopLeftRadius: size * 0.15,
      borderTopRightRadius: size * 0.15,
      borderBottomLeftRadius: size * 0.5,
      borderBottomRightRadius: size * 0.5,
      borderWidth: 1.5,
      borderColor: color,
    }} />
  </View>
);

const MapPinIcon = ({ size = 14, color = C.textMuted }) => (
  <View style={{ width: size, height: size * 1.3, alignItems: 'center' }}>
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color }} />
    <View style={{ width: 1.5, height: size * 0.4, backgroundColor: color }} />
  </View>
);

const MailIcon = ({ size = 14, color = C.textMuted }) => (
  <View style={{ width: size, height: size * 0.75, borderWidth: 1.5, borderColor: color, borderRadius: 2, justifyContent: 'flex-start', overflow: 'hidden' }}>
    <View style={{ width: size * 0.7, height: 1.5, backgroundColor: color, transform: [{ rotate: '30deg' }], marginLeft: -2, marginTop: 2 }} />
    <View style={{ width: size * 0.7, height: 1.5, backgroundColor: color, transform: [{ rotate: '-30deg' }], marginLeft: size * 0.3, marginTop: -1 }} />
  </View>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }) {
  return (
    <View style={[styles.statCard, accent && { borderColor: C.goldDim }]}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Badge card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 70, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.badgeCard}>
        <View style={styles.badgeAccentBar} />
        <View style={styles.badgeInner}>
          <View style={styles.badgeHeader}>
            <ShieldIcon size={14} color={C.gold} />
            <Text style={styles.badgeName}>{badge.name}</Text>
          </View>
          {badge.description ? (
            <Text style={styles.badgeDesc}>{badge.description}</Text>
          ) : null}
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
    <View style={styles.loadingContainer}>
      {[80, 120, 60, 100].map((w, i) => (
        <Animated.View key={i} style={[styles.skeleton, { width: `${w}%`, opacity: pulse, marginBottom: 16 }]} />
      ))}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const contentFade = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Token manquant');
      const response = await axios.get('https://lootopia-test.ordwen-dev.com/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(avatarScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]).start();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const initials = user
    ? `${user.firstname?.[0] ?? ''}${user.lastname?.[0] ?? ''}`.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'
    : '?';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerTopLine} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <BackIcon size={16} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <LoadingState />
        ) : !user ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Utilisateur introuvable</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: contentFade }}>

            {/* ── AVATAR SECTION ── */}
            <View style={styles.avatarSection}>
              <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: avatarScale }] }]}>
                <View style={styles.avatarRing}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                </View>
              </Animated.View>

              <Text style={styles.displayName}>
                {user.firstname} {user.lastname}
              </Text>
              <View style={styles.usernameRow}>
                <Text style={styles.usernameAt}>@</Text>
                <Text style={styles.username}>{user.username}</Text>
              </View>

              <View style={styles.emailRow}>
                <MailIcon size={11} color={C.textFaint} />
                <Text style={styles.emailText}>{user.mailAddress}</Text>
              </View>
            </View>

            {/* ── DIVIDER ── */}
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dividerLine} />
            </View>

            {/* ── STATS ── */}
            <View style={styles.statsRow}>
              <StatCard
                icon={<CrownIcon size={22} color={C.gold} />}
                label="Couronnes"
                value={user.crowns}
                accent
              />
              <StatCard
                icon={<MapPinIcon size={16} color={C.accent} />}
                label="Chasses complétées"
                value={user.completedHuntsCount}
              />
            </View>

            {/* ── BADGES ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ShieldIcon size={14} color={C.goldDim} />
                <Text style={styles.sectionTitle}>BADGES</Text>
                {user.participantBadges?.length > 0 && (
                  <View style={styles.sectionCount}>
                    <Text style={styles.sectionCountText}>{user.participantBadges.length}</Text>
                  </View>
                )}
              </View>

              {user.participantBadges?.length > 0 ? (
                <View style={styles.badgeList}>
                  {user.participantBadges.map((pb, index) => (
                    <BadgeCard key={index} badge={pb.badge} index={index} />
                  ))}
                </View>
              ) : (
                <View style={styles.noBadgeContainer}>
                  <ShieldIcon size={32} color={C.textFaint} />
                  <Text style={styles.noBadgeText}>Aucun badge obtenu</Text>
                  <Text style={styles.noBadgeSub}>Complétez des chasses pour en gagner</Text>
                </View>
              )}
            </View>

          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.6 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarWrapper: { marginBottom: 16 },
  avatarRing: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: C.gold,
    opacity: 0.9,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28, fontWeight: '700',
    color: C.gold, letterSpacing: 2,
  },
  displayName: {
    fontSize: 22, fontWeight: '700',
    color: C.text, letterSpacing: 0.3,
    textAlign: 'center',
  },
  usernameRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 4, marginBottom: 10,
  },
  usernameAt: { fontSize: 13, color: C.goldDim, fontFamily: 'monospace' },
  username: { fontSize: 13, color: C.textMuted, fontFamily: 'monospace' },
  emailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  emailText: { fontSize: 12, color: C.textFaint },

  // Divider
  sectionDivider: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerDiamond: {
    width: 6, height: 6,
    backgroundColor: C.goldDim,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 10,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: { marginBottom: 2 },
  statValue: {
    fontSize: 26, fontWeight: '700',
    color: C.text, letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 10, color: C.textMuted,
    fontFamily: 'monospace', letterSpacing: 1,
    textTransform: 'uppercase', textAlign: 'center',
  },

  // Section
  section: { paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    color: C.textMuted, letterSpacing: 2,
    fontFamily: 'monospace',
  },
  sectionCount: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 10, borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 7, paddingVertical: 1,
  },
  sectionCountText: { fontSize: 10, color: C.goldDim, fontFamily: 'monospace' },

  // Badge card
  badgeList: { gap: 10 },
  badgeCard: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  badgeAccentBar: { width: 3, backgroundColor: C.accent, opacity: 0.8 },
  badgeInner: { flex: 1, padding: 14 },
  badgeHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 4,
  },
  badgeName: {
    fontSize: 15, fontWeight: '700',
    color: C.text, letterSpacing: 0.2,
  },
  badgeDesc: { fontSize: 13, color: C.textMuted, lineHeight: 18 },

  // No badge
  noBadgeContainer: {
    alignItems: 'center', paddingVertical: 32,
    backgroundColor: C.surface,
    borderRadius: 10, borderWidth: 1,
    borderColor: C.border, gap: 8,
  },
  noBadgeText: { fontSize: 14, fontWeight: '600', color: C.textMuted, marginTop: 4 },
  noBadgeSub: { fontSize: 12, color: C.textFaint, textAlign: 'center' },

  // Loading
  loadingContainer: { padding: 20, paddingTop: 40 },
  skeleton: {
    height: 16, backgroundColor: C.surface,
    borderRadius: 8, alignSelf: 'center',
  },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, color: C.textMuted },
});