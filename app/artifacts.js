import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const BackIcon = ({ size = 16, color = C.text }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '-45deg' }, { translateY: 3 }] }} />
    <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }, { translateY: -3 }] }} />
    <View style={{ width: size * 0.75, height: 1.5, backgroundColor: color }} />
  </View>
);

const GemIcon = ({ size = 20, color = C.gold }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {/* Haut du losange */}
    <View style={{
      width: 0, height: 0,
      borderLeftWidth: size * 0.4, borderRightWidth: size * 0.4,
      borderBottomWidth: size * 0.35,
      borderLeftColor: 'transparent', borderRightColor: 'transparent',
      borderBottomColor: color,
      position: 'absolute', top: size * 0.05,
    }} />
    {/* Bas du losange */}
    <View style={{
      width: 0, height: 0,
      borderLeftWidth: size * 0.4, borderRightWidth: size * 0.4,
      borderTopWidth: size * 0.5,
      borderLeftColor: 'transparent', borderRightColor: 'transparent',
      borderTopColor: color,
      position: 'absolute', bottom: size * 0.05,
      opacity: 0.75,
    }} />
  </View>
);

const GridIcon = ({ size = 16, color = C.textMuted }) => (
  <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 1 }}>
    {[0,1,2,3].map(i => (
      <View key={i} style={{ width: (size - 6) / 2, height: (size - 6) / 2, borderRadius: 1, borderWidth: 1.5, borderColor: color }} />
    ))}
  </View>
);

const ListIcon = ({ size = 16, color = C.textMuted }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', gap: 3 }}>
    {[0.9, 0.7, 0.9].map((w, i) => (
      <View key={i} style={{ width: size * w, height: 1.5, backgroundColor: color }} />
    ))}
  </View>
);

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton({ layout }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (layout === 'grid') {
    return (
      <View style={styles.gridContainer}>
        {[1,2,3,4,5,6].map(i => (
          <Animated.View key={i} style={[styles.skeletonGrid, { opacity: pulse }]} />
        ))}
      </View>
    );
  }
  return (
    <View style={{ gap: 10, padding: 16 }}>
      {[1,2,3,4].map(i => (
        <Animated.View key={i} style={[styles.skeletonList, { opacity: pulse }]} />
      ))}
    </View>
  );
}

// ── Artifact Card — Vue liste ─────────────────────────────────────────────────
function ArtifactListCard({ item, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const { artifact, quantity } = item;
  const hasImage = artifact.imagePath && artifact.imagePath !== 'string';

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.listCard}>
        {/* Barre dorée à gauche */}
        <View style={styles.listCardAccent} />

        {/* Image ou placeholder */}
        <View style={styles.listCardImage}>
          {hasImage ? (
            <Image
              source={{ uri: artifact.imagePath }}
              style={styles.listCardImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.listCardImgPlaceholder}>
              <GemIcon size={22} color={C.goldDim} />
            </View>
          )}
        </View>

        {/* Infos */}
        <View style={styles.listCardInner}>
          <View style={styles.listCardHeader}>
            <Text style={styles.listCardTitle} numberOfLines={1}>{artifact.name}</Text>
            {/* Badge quantité */}
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>×{quantity}</Text>
            </View>
          </View>

          {artifact.description ? (
            <Text style={styles.listCardDesc} numberOfLines={2}>{artifact.description}</Text>
          ) : null}

          <View style={styles.listCardFooter}>
            <Text style={styles.listCardDate}>
              {new Date(artifact.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Artifact Card — Vue grille ────────────────────────────────────────────────
function ArtifactGridCard({ item, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 50, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const { artifact, quantity } = item;
  const hasImage = artifact.imagePath && artifact.imagePath !== 'string';

  return (
    <Animated.View style={[styles.gridCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      {/* Ligne dorée en haut */}
      <View style={styles.gridCardTopLine} />

      {/* Image */}
      <View style={styles.gridCardImageWrap}>
        {hasImage ? (
          <Image
            source={{ uri: artifact.imagePath }}
            style={styles.gridCardImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.gridCardImgPlaceholder}>
            <GemIcon size={28} color={C.goldDim} />
          </View>
        )}

        {/* Badge quantité flottant */}
        <View style={styles.gridQuantityBadge}>
          <Text style={styles.gridQuantityText}>×{quantity}</Text>
        </View>
      </View>

      {/* Nom */}
      <View style={styles.gridCardInner}>
        <Text style={styles.gridCardTitle} numberOfLines={2}>{artifact.name}</Text>
      </View>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ArtifactsScreen() {
  const router = useRouter();
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState('grid'); // 'grid' | 'list'

  const headerFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Token manquant');
      const response = await axios.get(
        'https://lootopia-test.ordwen-dev.com/api/me/artifacts',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setArtifacts(response.data || []);
      Animated.timing(contentFade, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }).start();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les artefacts');
    } finally {
      setLoading(false);
    }
  };

  const totalArtifacts = artifacts.reduce((acc, a) => acc + (a.quantity || 0), 0);

  const renderListItem = ({ item, index }) => (
    <ArtifactListCard item={item} index={index} />
  );

  const renderGridItem = ({ item, index }) => (
    <ArtifactGridCard item={item} index={index} />
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <GemIcon size={52} color={C.textFaint} />
      <Text style={styles.emptyTitle}>Aucun artefact</Text>
      <Text style={styles.emptySubtitle}>
        Complétez des chasses pour collecter des artefacts rares.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── HEADER ── */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <View style={styles.headerTopLine} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <BackIcon size={16} color={C.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <GemIcon size={16} color={C.gold} />
            <Text style={styles.headerTitle}>Artefacts</Text>
          </View>

          {/* Toggle vue grille / liste */}
          <View style={styles.layoutToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, layout === 'grid' && styles.toggleBtnActive]}
              onPress={() => setLayout('grid')}
            >
              <GridIcon size={14} color={layout === 'grid' ? C.gold : C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, layout === 'list' && styles.toggleBtnActive]}
              onPress={() => setLayout('list')}
            >
              <ListIcon size={14} color={layout === 'list' ? C.gold : C.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats rapides */}
        {!loading && artifacts.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{artifacts.length}</Text>
              <Text style={styles.statPillLabel}>type{artifacts.length > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{totalArtifacts}</Text>
              <Text style={styles.statPillLabel}>au total</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* ── CONTENU ── */}
      {loading ? (
        <LoadingSkeleton layout={layout} />
      ) : (
        <Animated.View style={[{ flex: 1 }, { opacity: contentFade }]}>
          {layout === 'grid' ? (
            <FlatList
              data={artifacts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderGridItem}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={ListEmpty}
            />
          ) : (
            <FlatList
              data={artifacts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderListItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              ListEmptyComponent={ListEmpty}
            />
          )}
        </Animated.View>
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
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  // Layout toggle
  layoutToggle: { flexDirection: 'row', gap: 4 },
  toggleBtn: { width: 32, height: 32, borderRadius: 7, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  toggleBtnActive: { borderColor: C.goldDim, backgroundColor: C.bg },

  // Stats header
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  statPill: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statPillValue: { fontSize: 13, fontWeight: '700', color: C.goldLight, fontFamily: 'monospace' },
  statPillLabel: { fontSize: 11, color: C.textFaint, fontFamily: 'monospace', letterSpacing: 0.5 },
  statDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textFaint },

  // ── Vue GRILLE ────────────────────────────────────────────────
  gridContent: { padding: 12, paddingBottom: 40, flexGrow: 1 },
  gridRow: { gap: 10, marginBottom: 10 },

  gridCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  gridCardTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.5 },
  gridCardImageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gridCardImg: { width: '100%', height: '100%' },
  gridCardImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridCardInner: { padding: 10 },
  gridCardTitle: { fontSize: 13, fontWeight: '700', color: C.text, letterSpacing: 0.2, lineHeight: 18 },

  // Badge quantité grille (flottant)
  gridQuantityBadge: {
    position: 'absolute',
    top: 8, right: 8,
    backgroundColor: 'rgba(14, 12, 9, 0.85)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.goldDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gridQuantityText: { fontSize: 11, fontFamily: 'monospace', color: C.gold, fontWeight: '700' },

  // ── Vue LISTE ─────────────────────────────────────────────────
  listContent: { padding: 16, paddingTop: 14, flexGrow: 1 },

  listCard: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  listCardAccent: { width: 3, backgroundColor: C.gold, opacity: 0.7 },
  listCardImage: {
    width: 72,
    height: 72,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listCardImg: { width: 72, height: 72 },
  listCardImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listCardInner: { flex: 1, padding: 12, justifyContent: 'space-between' },
  listCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  listCardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text, letterSpacing: 0.2 },
  listCardDesc: { fontSize: 12, color: C.textMuted, lineHeight: 17, marginTop: 3 },
  listCardFooter: { marginTop: 6 },
  listCardDate: { fontSize: 10, fontFamily: 'monospace', color: C.textFaint, letterSpacing: 0.5 },

  // Badge quantité liste
  quantityBadge: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: C.goldDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  quantityText: { fontSize: 11, fontFamily: 'monospace', color: C.gold, fontWeight: '700' },

  // Skeletons
  skeletonGrid: {
    flex: 1,
    aspectRatio: 0.85,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  skeletonList: {
    height: 72,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textMuted, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: C.textFaint, textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 },
});