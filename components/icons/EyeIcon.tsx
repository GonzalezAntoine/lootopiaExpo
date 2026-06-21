import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface EyeIconProps {
  size?: number;
  color?: string;
  closed?: boolean;
}

export function EyeIcon({ size = 16, color = C.textMuted, closed = false }: EyeIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {closed ? (
        <View
          style={{
            width: size * 0.8,
            height: 1.5,
            backgroundColor: color,
            transform: [{ rotate: '-20deg' }],
          }}
        />
      ) : (
        <>
          <View
            style={{
              width: size * 0.75,
              height: size * 0.5,
              borderRadius: size * 0.3,
              borderWidth: 1.5,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: size * 0.125,
              backgroundColor: color,
            }}
          />
        </>
      )}
    </View>
  );
}