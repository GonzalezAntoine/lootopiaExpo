import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface GemIconProps {
  size?: number;
  color?: string;
}

export function GemIcon({ size = 20, color = C.gold }: GemIconProps) {
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
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.4,
          borderRightWidth: size * 0.4,
          borderBottomWidth: size * 0.35,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          position: 'absolute',
          top: size * 0.05,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.4,
          borderRightWidth: size * 0.4,
          borderTopWidth: size * 0.5,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          position: 'absolute',
          bottom: size * 0.05,
          opacity: 0.75,
        }}
      />
    </View>
  );
}