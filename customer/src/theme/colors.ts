export const Colors = {
  // Backgrounds
  bgPrimary: '#0A1628',
  bgSecondary: '#0F1F3D',
  bgDark: '#050D1F',

  // Accent
  gold: '#F5C842',
  goldPressed: '#E0A800',
  goldSubtle: 'rgba(245, 200, 66, 0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#ADB5BD',
  textDisabled: '#6C757D',

  // Surfaces
  surfaceBorder: '#1E3A6E',
  surface: '#0F1F3D',
  surfaceElevated: '#162B4D',

  // Status
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',

  // Order status colors
  statusPending: '#F39C12',
  statusAccepted: '#3498DB',
  statusCollecting: '#9B59B6',
  statusCollected: '#2980B9',
  statusInProgress: '#E67E22',
  statusReady: '#27AE60',
  statusDelivered: '#2ECC71',
  statusCancelled: '#E74C3C',
  statusDeclined: '#E74C3C',

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export type ColorKey = keyof typeof Colors;

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return Colors.statusPending;
    case 'accepted':
      return Colors.statusAccepted;
    case 'collecting':
      return Colors.statusCollecting;
    case 'collected':
      return Colors.statusCollected;
    case 'in_progress':
      return Colors.statusInProgress;
    case 'ready':
      return Colors.statusReady;
    case 'delivered':
      return Colors.statusDelivered;
    case 'cancelled':
      return Colors.statusCancelled;
    case 'declined':
      return Colors.statusDeclined;
    default:
      return Colors.textDisabled;
  }
}
