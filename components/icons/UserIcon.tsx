import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface UserIconProps {
  size?: number;
  color?: string;
}

export function UserIcon({ size = 16, color = C.textMuted }: UserIconProps) {
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
          height: size * 0.5,
          borderRadius: size * 0.25,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.8,
          height: size * 0.35,
          borderTopLeftRadius: size * 0.4,
          borderTopRightRadius: size * 0.4,
          borderWidth: 1.5,
          borderColor: color,
          borderBottomWidth: 0,
          marginTop: 1,
        }}
      />
    </View>
  );
}