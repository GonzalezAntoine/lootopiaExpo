import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface GridIconProps {
  size?: number;
  color?: string;
}

export function GridIcon({ size = 16, color = C.textMuted }: GridIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        padding: 1,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: (size - 6) / 2,
            height: (size - 6) / 2,
            borderRadius: 1,
            borderWidth: 1.5,
            borderColor: color,
          }}
        />
      ))}
    </View>
  );
}