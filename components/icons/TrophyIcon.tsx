import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface TrophyIconProps {
  size?: number;
  color?: string;
}

export function TrophyIcon({ size = 14, color = C.gold }: TrophyIconProps) {
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
          height: size * 0.65,
          borderRadius: 3,
          borderWidth: 1.5,
          borderColor: color,
          borderBottomWidth: 0,
        }}
      />
      <View
        style={{
          width: size * 0.4,
          height: 2,
          backgroundColor: color,
          marginTop: -1,
        }}
      />
      <View style={{ width: size * 0.6, height: 1.5, backgroundColor: color }} />
    </View>
  );
}