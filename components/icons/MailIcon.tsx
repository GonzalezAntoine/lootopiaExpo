import { View } from 'react-native';
import { C } from '@/constants/lootopiaTheme';

export interface MailIconProps {
  size?: number;
  color?: string;
}

export function MailIcon({ size = 14, color = C.textMuted }: MailIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size * 0.75,
        borderWidth: 1.5,
        borderColor: color,
        borderRadius: 2,
        justifyContent: 'flex-start',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: size * 0.7,
          height: 1.5,
          backgroundColor: color,
          transform: [{ rotate: '30deg' }],
          marginLeft: -2,
          marginTop: 2,
        }}
      />
      <View
        style={{
          width: size * 0.7,
          height: 1.5,
          backgroundColor: color,
          transform: [{ rotate: '-30deg' }],
          marginLeft: size * 0.3,
          marginTop: -1,
        }}
      />
    </View>
  );
}