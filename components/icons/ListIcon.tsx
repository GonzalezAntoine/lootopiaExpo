import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface ListIconProps {
  size?: number;
  color?: string;
}

export function ListIcon({ size = 16, color = C.textMuted }: ListIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        gap: 3,
      }}
    >
      {[0.9, 0.7, 0.9].map((w, i) => (
        <View key={i} style={{ width: size * w, height: 1.5, backgroundColor: color }} />
      ))}
    </View>
  );
}