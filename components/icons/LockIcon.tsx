import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface LockIconProps {
  size?: number;
  color?: string;
}

export function LockIcon({ size = 16, color = C.textMuted }: LockIconProps) {
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
          width: size * 0.6,
          height: size * 0.45,
          borderRadius: 2,
          borderWidth: 1.5,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
      </View>
      <View
        style={{
          width: size * 0.55,
          height: size * 0.3,
          borderTopLeftRadius: size * 0.28,
          borderTopRightRadius: size * 0.28,
          borderWidth: 1.5,
          borderColor: color,
          borderBottomWidth: 0,
          position: 'absolute',
          top: 0,
        }}
      />
    </View>
  );
}