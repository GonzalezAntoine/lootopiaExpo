import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface MapPinIconProps {
  size?: number;
  color?: string;
}

export function MapPinIcon({ size = 14, color = C.textMuted }: MapPinIconProps) {
  return (
    <View style={{ width: size, height: size * 1.3, alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View style={{ width: 1.5, height: size * 0.4, backgroundColor: color }} />
    </View>
  );
}