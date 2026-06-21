import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface ShieldIconProps {
  size?: number;
  color?: string;
}

export function ShieldIcon({ size = 18, color = C.gold }: ShieldIconProps) {
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
          width: size * 0.75,
          height: size * 0.85,
          borderTopLeftRadius: size * 0.15,
          borderTopRightRadius: size * 0.15,
          borderBottomLeftRadius: size * 0.5,
          borderBottomRightRadius: size * 0.5,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
    </View>
  );
}