import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0E0C09",
  surface: "#1A1710",
  surfaceAlt: "#211E14",
  border: "#2E2B1E",
  gold: "#C9A84C",
  goldLight: "#E8C96A",
  goldDim: "#7A6128",
  text: "#EDE8D8",
  textMuted: "#8A8470",
  textFaint: "#504C3D",
  accent: "#5C8A5E",
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const ScrollIcon = ({ size = 18, color = C.gold }) => (
  <View
    style={{
      width: size,
      height: size * 1.2,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: color,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    }}
  >
    {[0.7, 0.5, 0.35].map((w, i) => (
      <View
        key={i}
        style={{
          width: size * w,
          height: 1.5,
          backgroundColor: color,
          opacity: 1 - i * 0.25,
        }}
      />
    ))}
  </View>
);

const UserIcon = ({ size = 13, color = C.textMuted }) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <View
      style={{
        width: size * 0.5,
        height: size * 0.5,
        borderRadius: size * 0.25,
        borderWidth: 1.5,
        borderColor: color,
      }}
    />
    <View
      style={{
        width: size * 0.8,
        height: size * 0.35,
        borderTopLeftRadius: size * 0.4,
        borderTopRightRadius: size * 0.4,
        borderWidth: 1.5,
        borderColor: color,
        borderBottomWidth: 0,
        marginTop: 1,
      }}
    />
  </View>
);

const CrownIcon = ({ size = 14, color = C.gold }) => (
  <View
    style={{
      width: size,
      height: size * 0.85,
      alignItems: "center",
      justifyContent: "flex-end",
    }}
  >
    <View
      style={{
        width: size,
        height: size * 0.45,
        borderLeftWidth: size * 0.12,
        borderRightWidth: size * 0.12,
        borderBottomWidth: size * 0.45,
        borderColor: "transparent",
        borderBottomColor: color,
        position: "absolute",
        bottom: 0,
      }}
    />
    {[-1, 0, 1].map((o, i) => (
      <View
        key={i}
        style={{
          position: "absolute",
          bottom: size * 0.35,
          left: size * 0.5 + o * size * 0.32 - size * 0.07,
          width: size * 0.14,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: color,
        }}
      />
    ))}
  </View>
);

const GroupIcon = ({ size = 14, color = C.accent }) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <View
      style={{
        width: size * 0.42,
        height: size * 0.42,
        borderRadius: size * 0.21,
        borderWidth: 1.5,
        borderColor: color,
        position: "absolute",
        left: 0,
      }}
    />
    <View
      style={{
        width: size * 0.42,
        height: size * 0.42,
        borderRadius: size * 0.21,
        borderWidth: 1.5,
        borderColor: color,
        position: "absolute",
        left: size * 0.24,
      }}
    />
    <View
      style={{
        width: size * 0.55,
        height: size * 0.28,
        borderTopLeftRadius: size * 0.28,
        borderTopRightRadius: size * 0.28,
        borderWidth: 1.5,
        borderColor: color,
        borderBottomWidth: 0,
        position: "absolute",
        bottom: 0,
        left: 0,
      }}
    />
    <View
      style={{
        width: size * 0.55,
        height: size * 0.28,
        borderTopLeftRadius: size * 0.28,
        borderTopRightRadius: size * 0.28,
        borderWidth: 1.5,
        borderColor: color,
        borderBottomWidth: 0,
        position: "absolute",
        bottom: 0,
        left: size * 0.2,
      }}
    />
  </View>
);

const GiftIcon = ({ size = 14, color = C.gold }) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <View
      style={{
        width: size * 0.85,
        height: size * 0.6,
        borderRadius: 2,
        borderWidth: 1.5,
        borderColor: color,
        position: "absolute",
        bottom: 0,
      }}
    />
    <View
      style={{
        width: size * 0.85,
        height: size * 0.22,
        borderRadius: 1,
        borderWidth: 1.5,
        borderColor: color,
        position: "absolute",
        top: size * 0.25,
      }}
    />
    <View
      style={{
        width: 1.5,
        height: size * 0.6,
        backgroundColor: color,
        position: "absolute",
        bottom: 0,
      }}
    />
    <View
      style={{
        width: size * 0.3,
        height: size * 0.22,
        borderTopLeftRadius: size * 0.15,
        borderTopRightRadius: size * 0.15,
        borderWidth: 1.5,
        borderColor: color,
        borderBottomWidth: 0,
        position: "absolute",
        top: 0,
        left: size * 0.15,
      }}
    />
    <View
      style={{
        width: size * 0.3,
        height: size * 0.22,
        borderTopLeftRadius: size * 0.15,
        borderTopRightRadius: size * 0.15,
        borderWidth: 1.5,
        borderColor: color,
        borderBottomWidth: 0,
        position: "absolute",
        top: 0,
        right: size * 0.15,
      }}
    />
  </View>
);

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ icon, title, children, delay = 0 }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.section,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionLine} />
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </Animated.View>
  );
}

function ParticipantPill({ username }) {
  const initials = username?.slice(0, 2).toUpperCase() || "??";
  return (
    <View style={styles.pill}>
      <View style={styles.pillAvatar}>
        <Text style={styles.pillInitials}>{initials}</Text>
      </View>
      <Text style={styles.pillName}>{username}</Text>
    </View>
  );
}

function RewardCard({ reward }) {
  return (
    <View style={styles.rewardCard}>
      <View style={styles.rewardAccent} />
      <View style={styles.rewardInner}>
        <CrownIcon size={16} color={C.gold} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rewardAmount}>{reward.crownAmount}</Text>
          <Text style={styles.rewardLabel}>couronnes</Text>
        </View>
      </View>
    </View>
  );
}

function LoadingState() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <View style={{ padding: 20, gap: 14 }}>
      {[90, 55, 70, 40, 80].map((w, i) => (
        <Animated.View
          key={i}
          style={[styles.skeleton, { width: `${w}%`, opacity: pulse }]}
        />
      ))}
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HuntDetailScreen() {
  const { id, title: paramTitle } = useLocalSearchParams();
  const [hunt, setHunt] = useState(null);
  const [loading, setLoading] = useState(true);

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-16)).current;

  // Titre disponible immédiatement depuis le paramètre, puis confirmé par le fetch
  const displayTitle = hunt?.title || paramTitle || "Chasse";

  useEffect(() => {
    if (id) fetchHuntDetail();
  }, [id]);

  const fetchHuntDetail = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token || !id) throw new Error("Token ou Hunt ID manquant");
      const response = await axios.get(
        `https://lootopia-test.ordwen-dev.com/api/hunts/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setHunt(response.data);
      Animated.parallel([
        Animated.timing(heroFade, {
          toValue: 1,
          duration: 500,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(heroSlide, {
          toValue: 0,
          duration: 500,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger la chasse");
    } finally {
      setLoading(false);
    }
  };

  const difficulty = hunt ? (hunt.id % 3) + 1 : 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/*
        Stack.Screen met à jour le titre du header natif défini dans _layout.js.
        `paramTitle` est disponible dès l'ouverture de l'écran (pas besoin d'attendre le fetch),
        ce qui évite d'afficher "Chasse" ou "[id]" le temps du chargement.
      */}
      <Stack.Screen options={{ title: displayTitle }} />

      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <LoadingState />
        ) : !hunt ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Chasse introuvable</Text>
          </View>
        ) : (
          <>
            {/* ── HERO ── */}
            <Animated.View
              style={[
                styles.hero,
                { opacity: heroFade, transform: [{ translateY: heroSlide }] },
              ]}
            >
              <View style={styles.heroTopLine} />
              <View style={styles.heroInner}>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.diffRow}>
                    {[1, 2, 3].map((d) => (
                      <View
                        key={d}
                        style={[
                          styles.diffDot,
                          {
                            backgroundColor:
                              d <= difficulty ? C.gold : C.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  {hunt.organizer?.username && (
                    <View style={styles.organizerBadge}>
                      <UserIcon size={11} color={C.goldDim} />
                      <Text style={styles.organizerText}>
                        {hunt.organizer.username}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.heroTitle}>{hunt.title}</Text>
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <GroupIcon size={12} color={C.accent} />
                    <Text style={styles.heroStatText}>
                      {hunt.participants?.length ?? 0} participant
                      {hunt.participants?.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={styles.heroStatSep} />
                  <View style={styles.heroStat}>
                    <CrownIcon size={12} color={C.gold} />
                    <Text style={styles.heroStatText}>
                      {hunt.rewards?.reduce(
                        (acc, r) => acc + (r.crownAmount || 0),
                        0,
                      ) ?? 0}{" "}
                      couronnes
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            <Section
              icon={<ScrollIcon size={13} color={C.goldDim} />}
              title="DESCRIPTION"
              delay={200}
            >
              <Text style={styles.descText}>
                {hunt.description ||
                  "Aucune description disponible pour cette chasse."}
              </Text>
            </Section>

            <Section
              icon={<GroupIcon size={13} color={C.accent} />}
              title="PARTICIPANTS"
              delay={300}
            >
              {hunt.participants?.length > 0 ? (
                <View style={styles.pillGrid}>
                  {hunt.participants.map((p) => (
                    <ParticipantPill key={p.id} username={p.username} />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyRowText}>
                  Aucun participant pour l'instant
                </Text>
              )}
            </Section>

            <Section
              icon={<GiftIcon size={13} color={C.gold} />}
              title="RÉCOMPENSES"
              delay={400}
            >
              {hunt.rewards?.length > 0 ? (
                <View style={styles.rewardList}>
                  {hunt.rewards.map((r) => (
                    <RewardCard key={r.id} reward={r} />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyRowText}>
                  Aucune récompense définie
                </Text>
              )}
            </Section>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  hero: {
    margin: 16,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  heroTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.5 },
  heroInner: { padding: 18 },
  heroBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  diffRow: { flexDirection: "row", gap: 5 },
  diffDot: { width: 8, height: 8, borderRadius: 4 },
  organizerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  organizerText: { fontSize: 11, color: C.textMuted, fontFamily: "monospace" },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: C.text,
    lineHeight: 30,
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  heroStats: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroStatText: { fontSize: 12, color: C.textMuted, fontFamily: "monospace" },
  heroStatSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.textFaint,
  },

  section: { paddingHorizontal: 16, marginBottom: 6 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textMuted,
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.border },
  sectionBody: {},

  descText: {
    fontSize: 14,
    color: C.textMuted,
    lineHeight: 22,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },

  pillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 5,
  },
  pillAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pillInitials: { fontSize: 10, fontWeight: "700", color: C.textMuted },
  pillName: { fontSize: 13, color: C.text, fontWeight: "500" },

  rewardList: { gap: 8 },
  rewardCard: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    overflow: "hidden",
  },
  rewardAccent: { width: 3, backgroundColor: C.gold, opacity: 0.7 },
  rewardInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  rewardAmount: { fontSize: 20, fontWeight: "800", color: C.goldLight },
  rewardLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },

  emptyRowText: {
    fontSize: 13,
    color: C.textFaint,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: { fontSize: 16, color: C.textMuted },

  skeleton: {
    height: 18,
    backgroundColor: C.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
});
