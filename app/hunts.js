import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// ── Palette ──────────────────────────────────────────────────────────────────
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

const ITEMS_PER_PAGE = 10;

// ── Icons ─────────────────────────────────────────────────────────────────────
const CompassIcon = ({ size = 18, color = C.gold }) => (
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
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{ width: 2, height: size * 0.35, backgroundColor: "#E55" }}
      />
      <View
        style={{
          width: 2,
          height: size * 0.35,
          backgroundColor: color,
          marginTop: -2,
        }}
      />
    </View>
  </View>
);

const MapPinIcon = ({ size = 14, color = C.gold }) => (
  <View style={{ width: size, height: size * 1.3, alignItems: "center" }}>
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        backgroundColor: "transparent",
      }}
    />
    <View style={{ width: 1.5, height: size * 0.4, backgroundColor: color }} />
  </View>
);

const TrophyIcon = ({ size = 14, color = C.gold }) => (
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
        width: size * 0.75,
        height: size * 0.65,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: color,
        borderBottomWidth: 0,
      }}
    />
    <View
      style={{
        width: size * 0.4,
        height: 2,
        backgroundColor: color,
        marginTop: -1,
      }}
    />
    <View style={{ width: size * 0.6, height: 1.5, backgroundColor: color }} />
  </View>
);

const UserIcon = ({ size = 14, color = C.text }) => (
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

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== "…") {
        pages.push("…");
      }
    }
    return pages;
  };

  return (
    <View style={pStyles.row}>
      <TouchableOpacity
        style={[pStyles.btn, page === 1 && pStyles.btnOff]}
        onPress={onPrev}
        disabled={page === 1}
      >
        <Text style={[pStyles.arrow, page === 1 && pStyles.arrowOff]}>‹</Text>
      </TouchableOpacity>

      <View style={pStyles.numbers}>
        {getPages().map((p, i) =>
          p === "…" ? (
            <Text key={`e${i}`} style={pStyles.ellipsis}>
              …
            </Text>
          ) : (
            <TouchableOpacity
              key={p}
              style={[pStyles.num, p === page && pStyles.numActive]}
              onPress={() => {
                if (p < page) onPrev();
                else if (p > page) onNext();
              }}
              disabled={p === page}
            >
              <Text
                style={[pStyles.numText, p === page && pStyles.numTextActive]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      <TouchableOpacity
        style={[pStyles.btn, page === totalPages && pStyles.btnOff]}
        onPress={onNext}
        disabled={page === totalPages}
      >
        <Text style={[pStyles.arrow, page === totalPages && pStyles.arrowOff]}>
          ›
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const pStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOff: { opacity: 0.25 },
  arrow: { fontSize: 22, color: C.gold, lineHeight: 30, fontWeight: "600" },
  arrowOff: { color: C.textFaint },
  numbers: { flexDirection: "row", alignItems: "center", gap: 4 },
  num: {
    minWidth: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  numActive: { backgroundColor: C.gold, borderColor: C.gold },
  numText: { fontSize: 13, color: C.textMuted, fontFamily: "monospace" },
  numTextActive: { color: C.bg, fontWeight: "700" },
  ellipsis: { fontSize: 13, color: C.textFaint, paddingHorizontal: 2 },
});

// ── Hunt Card ─────────────────────────────────────────────────────────────────
function HuntCard({ item, onPress, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const difficulty = (item.id % 3) + 1;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.card}>
          <View style={styles.cardAccentBar} />
          <View style={styles.cardInner}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.huntNumberBadge}>
                  <Text style={styles.huntNumberText}>
                    #{String(item.id).padStart(3, "0")}
                  </Text>
                </View>
              </View>
              <View style={styles.difficultyRow}>
                {[1, 2, 3].map((d) => (
                  <View
                    key={d}
                    style={[
                      styles.difficultyDot,
                      { backgroundColor: d <= difficulty ? C.gold : C.border },
                    ]}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.cardDivider} />
            <Text style={styles.cardDesc} numberOfLines={3}>
              {item.description ||
                "Aucune description disponible pour cette chasse."}
            </Text>
            <View style={styles.cardFooter}>
              <View style={styles.cardFooterLeft}>
                <MapPinIcon size={11} color={C.textMuted} />
                <Text style={styles.cardMeta}> Explorer</Text>
              </View>
              <View style={styles.chevronContainer}>
                <Text style={styles.chevron}>›</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HuntsScreen() {
  const router = useRouter();
  const [hunts, setHunts] = useState([]);
  const [mode, setMode] = useState("all");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const headerFade = useRef(new Animated.Value(0)).current;

  const totalPages = Math.max(1, Math.ceil(hunts.length / ITEMS_PER_PAGE));
  const pageHunts = hunts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchHunts();
  }, [mode]);

  const fetchHunts = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const endpoint =
        mode === "all"
          ? "https://lootopia-test.ordwen-dev.com/api/hunts"
          : "https://lootopia-test.ordwen-dev.com/api/me/hunts";
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHunts(response.data.member || []);
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible de charger les chasses.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <HuntCard
      item={item}
      index={index}
      onPress={() =>
        router.push({
          pathname: `/hunt/${item.id}`,
          params: { title: item.title },
        })
      }
    />
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <CompassIcon size={48} color={C.goldDim} />
      <Text style={styles.emptyTitle}>
        {loading ? "Chargement…" : "Aucune chasse trouvée"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {loading
          ? ""
          : mode === "me"
            ? "Vous n'avez pas encore créé de chasse."
            : "Aucune chasse disponible pour le moment."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── HEADER ── */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <View style={styles.headerTopLine} />

        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <CompassIcon size={22} color={C.gold} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.headerEyebrow}>LOOTOPIA</Text>
              <Text style={styles.headerTitle}>Chasses</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/profile")}
            >
              <UserIcon size={15} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { marginLeft: 8 }]}
              onPress={() => router.push("/leaderboard")}
            >
              <TrophyIcon size={15} color={C.gold} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FILTER TABS ── */}
        <View style={styles.tabRow}>
          {[
            { key: "all", label: "Toutes les chasses" },
            { key: "me", label: "Mes chasses" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, mode === tab.key && styles.tabActive]}
              onPress={() => setMode(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
              {mode === tab.key && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── COUNT + PAGE INFO ── */}
        {hunts.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {hunts.length} chasse{hunts.length > 1 ? "s" : ""}
            </Text>
            {totalPages > 1 && (
              <Text style={styles.countText}>
                page {page} / {totalPages}
              </Text>
            )}
          </View>
        )}
      </Animated.View>

      {/* ── LIST ── */}
      <FlatList
        data={pageHunts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.6 },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 16,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerEyebrow: {
    fontFamily: "monospace",
    fontSize: 9,
    letterSpacing: 4,
    color: C.goldDim,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    letterSpacing: 0.5,
    marginTop: -2,
  },
  headerActions: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 4,
  },
  tab: { marginRight: 24, paddingVertical: 12, position: "relative" },
  tabActive: {},
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textMuted,
    letterSpacing: 0.3,
  },
  tabTextActive: { color: C.goldLight },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: C.gold,
    borderRadius: 1,
  },

  // Count — une seule déclaration, avec flexDirection row pour aligner les deux textes
  countBadge: {
    paddingHorizontal: 20,
    paddingTop: 8, // espace entre les tabs et le compteur
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  countText: {
    fontSize: 11,
    color: C.textFaint,
    fontFamily: "monospace",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // List
  listContent: { padding: 16, paddingTop: 12, flexGrow: 1 },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    overflow: "hidden",
  },
  cardAccentBar: { width: 3, backgroundColor: C.gold, opacity: 0.7 },
  cardInner: { flex: 1, padding: 14 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center" },
  huntNumberBadge: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  huntNumberText: {
    fontSize: 10,
    fontFamily: "monospace",
    color: C.goldDim,
    letterSpacing: 1,
  },
  difficultyRow: { flexDirection: "row", gap: 4 },
  difficultyDot: { width: 7, height: 7, borderRadius: 4 },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    lineHeight: 22,
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  cardDivider: { height: 1, backgroundColor: C.border, marginBottom: 8 },
  cardDesc: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardFooterLeft: { flexDirection: "row", alignItems: "center" },
  cardMeta: {
    fontSize: 11,
    color: C.textFaint,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chevronContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  chevron: { fontSize: 16, color: C.gold, lineHeight: 20, marginLeft: 1 },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: C.textMuted,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.textFaint,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 18,
  },
});
