import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface SearchIconProps {
  size?: number;
  color?: string;
}

export function SearchIcon({ size = 14, color = C.textMuted }: SearchIconProps) {
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
          width: size * 0.65,
          height: size * 0.65,
          borderRadius: size * 0.33,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          width: 1.5,
          height: size * 0.35,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
          position: 'absolute',
          bottom: 0,
          right: size * 0.05,
        }}
      />
    </View>
  );
}