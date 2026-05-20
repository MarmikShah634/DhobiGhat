export const Colors = {
  bgPrimary: '#0A1628',
  bgSecondary: '#0F1F3D',
  bgDark: '#050D1F',
  gold: '#F5C842',
  goldPressed: '#E0A800',
  goldSubtle: 'rgba(245, 200, 66, 0.15)',
  textPrimary: '#FFFFFF',
  textSecondary: '#ADB5BD',
  textDisabled: '#6C757D',
  surfaceBorder: '#1E3A6E',
  surface: '#0F1F3D',
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  statusPending: '#F39C12',
  statusAccepted: '#3498DB',
  statusCollecting: '#9B59B6',
  statusCollected: '#2980B9',
  statusInProgress: '#E67E22',
  statusReady: '#27AE60',
  statusDelivered: '#2ECC71',
  statusCancelled: '#E74C3C',
  statusDeclined: '#E74C3C',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: Colors.statusPending, accepted: Colors.statusAccepted,
    collecting: Colors.statusCollecting, collected: Colors.statusCollected,
    in_progress: Colors.statusInProgress, ready: Colors.statusReady,
    delivered: Colors.statusDelivered, cancelled: Colors.statusCancelled,
    declined: Colors.statusDeclined,
  };
  return map[status] ?? Colors.textDisabled;
}
