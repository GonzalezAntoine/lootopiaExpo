import { StyleSheet } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  brand: { alignItems: 'center', marginBottom: 36 },
  logoRing: { padding: 6, borderRadius: 60, borderWidth: 1, borderColor: C.goldDim, marginBottom: 20 },
  logoRingInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  brandEyebrow: { fontSize: 9, letterSpacing: 5, color: C.goldDim, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4 },
  brandName: { fontSize: 36, fontWeight: '800', color: C.text, letterSpacing: 6, textTransform: 'uppercase' },
  brandTaglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  brandTaglineLine: { width: 40, height: 1, backgroundColor: C.border },
  brandTagline: { fontSize: 11, color: C.textMuted, letterSpacing: 1.5, fontFamily: 'monospace' },

  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 24 },
  cardTopLine: { height: 2, backgroundColor: C.gold, opacity: 0.6 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: 0.3, paddingHorizontal: 24, paddingTop: 22 },
  cardSubtitle: { fontSize: 13, color: C.textMuted, paddingHorizontal: 24, marginTop: 4, marginBottom: 20 },

  fields: { paddingHorizontal: 20, gap: 12, marginBottom: 16 },

  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, height: 50, gap: 10 },
  inputIcon: { width: 20, alignItems: 'center' },
  input: { flex: 1, fontSize: 15, color: C.text },
  inputRight: { width: 24, alignItems: 'center' },

  errorText: { fontSize: 12, color: C.error, textAlign: 'center', paddingHorizontal: 24, marginBottom: 8, lineHeight: 18 },

  btnWrapper: { paddingHorizontal: 20, marginBottom: 6 },
  btn: { backgroundColor: C.gold, borderRadius: 10, overflow: 'hidden' },
  btnDisabled: { opacity: 0.45 },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 24, gap: 8 },
  btnText: { fontSize: 15, fontWeight: '700', color: C.bg, letterSpacing: 0.5 },
  btnArrow: { fontSize: 20, color: C.bg, fontWeight: '700', lineHeight: 22 },

  cardBottom: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 8 },
  cardBottomDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.textFaint },
  cardBottomLine: { flex: 1, height: 1, backgroundColor: C.border },

  footer: { alignItems: 'center' },
  footerText: { fontSize: 10, color: C.textFaint, fontFamily: 'monospace', letterSpacing: 1.5, textAlign: 'center' },

  twoFaHeader: { alignItems: 'center', paddingTop: 22, paddingHorizontal: 24 },
  twoFaIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.goldDim, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },

  twoFaInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 16, backgroundColor: C.surfaceAlt, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 10 },
  twoFaInfoText: { fontSize: 12, color: C.textMuted, flex: 1 },

  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  codeBox: { width: 44, height: 52, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  codeBoxFilled: { borderColor: C.goldDim, backgroundColor: '#1F1C10' },
  codeBoxActive: { borderColor: C.gold },
  codeChar: { fontSize: 22, fontWeight: '800', color: C.goldLight, fontFamily: 'monospace' },
  codeHiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },

  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  timerLabel: { fontSize: 12, color: C.textFaint, fontFamily: 'monospace' },
  timerText: { fontSize: 13, color: C.goldDim, fontFamily: 'monospace', fontWeight: '700' },
  timerTextLow: { color: C.error },

  backLink: { alignItems: 'center', paddingVertical: 10 },
  backLinkText: { fontSize: 13, color: C.textMuted, letterSpacing: 0.3 },
});