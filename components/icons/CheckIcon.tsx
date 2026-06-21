import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface CheckIconProps {
  size?: number;
  color?: string;
}

export function CheckIcon({ size = 14, color = C.accent }: CheckIconProps) {
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
          width: size * 0.35,
          height: 1.5,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }, { translateY: 2 }],
        }}
      />
      <View
        style={{
          width: size * 0.6,
          height: 1.5,
          backgroundColor: color,
          transform: [{ rotate: '-55deg' }, { translateX: 3 }],
        }}
      />
    </View>
  );
}