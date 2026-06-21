import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface CrownIconProps {
  size?: number;
  color?: string;
}

export function CrownIcon({ size = 13, color = C.gold }: CrownIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size * 0.85,
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <View
        style={{
          width: size,
          height: size * 0.45,
          backgroundColor: 'transparent',
          borderLeftWidth: size * 0.12,
          borderRightWidth: size * 0.12,
          borderBottomWidth: size * 0.45,
          borderColor: 'transparent',
          borderBottomColor: color,
          position: 'absolute',
          bottom: 0,
        }}
      />
      {[-1, 0, 1].map((offset, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            bottom: size * 0.35,
            left: size * 0.5 + offset * size * 0.32 - size * 0.07,
            width: size * 0.14,
            height: size * 0.14,
            borderRadius: size * 0.07,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}