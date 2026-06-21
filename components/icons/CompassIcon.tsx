import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface CompassIconProps {
  size?: number;
  color?: string;
}

export function CompassIcon({ size = 18, color = C.gold }: CompassIconProps) {
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
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 2, height: size * 0.35, backgroundColor: '#E55' }} />
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
}