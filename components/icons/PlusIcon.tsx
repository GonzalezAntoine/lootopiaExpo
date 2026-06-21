import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface PlusIconProps {
  size?: number;
  color?: string;
}

export function PlusIcon({ size = 16, color = C.bg }: PlusIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: size, height: 2, backgroundColor: color, position: 'absolute' }} />
      <View style={{ width: 2, height: size, backgroundColor: color, position: 'absolute' }} />
    </View>
  );
}