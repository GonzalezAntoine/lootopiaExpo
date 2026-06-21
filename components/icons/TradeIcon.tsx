import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface TradeIconProps {
  size?: number;
  color?: string;
}

export function TradeIcon({ size = 16, color = C.gold }: TradeIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <View style={{ width: size * 0.55, height: 1.5, backgroundColor: color }} />
        <View
          style={{
            width: 0,
            height: 0,
            borderTopWidth: 4,
            borderBottomWidth: 4,
            borderLeftWidth: 5,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: color,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <View
          style={{
            width: 0,
            height: 0,
            borderTopWidth: 4,
            borderBottomWidth: 4,
            borderRightWidth: 5,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderRightColor: color,
          }}
        />
        <View style={{ width: size * 0.55, height: 1.5, backgroundColor: color }} />
      </View>
    </View>
  );
}