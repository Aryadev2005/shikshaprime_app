import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';

type Props = {
  name: string;
  size?: number;
  color?: string;
};

const iconMap: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  search: 'magnify',
  edit: 'pencil',
  pin: 'pin',
  bell: 'bell-outline',
  mic: 'microphone',
  check: 'check',
  x: 'close',
  undo: 'undo-variant',
  clock: 'clock-outline',
  flame: 'fire',
  filter: 'filter-variant',
  download: 'download',
  arrowR: 'arrow-right',
  plus: 'plus',
  sort: 'sort-variant',
  file: 'file-document-outline',
  wallet: 'wallet',
  chart: 'chart-bar',
  qr: 'qrcode-scan',
  grad: 'bank-outline',
  chevL: 'chevron-left',
  chat: 'chat-outline',
};

export const Icon: React.FC<Props> = ({ name, size = 20, color = TOKENS.ink }) => (
  <MaterialCommunityIcons
    name={(iconMap[name] ?? name) as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
    size={size}
    color={color}
  />
);
