import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface BackIconProps {
  size?: number;
  color?: string;
}

export function BackIcon({ size = 16, color = C.text }: BackIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.5,
          height: 1.5,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }, { translateY: 3 }],
        }}
      />
      <View
        style={{
          width: size * 0.5,
          height: 1.5,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }, { translateY: -3 }],
        }}
      />
      <View style={{ width: size * 0.75, height: 1.5, backgroundColor: color }} />
    </View>
  );
}