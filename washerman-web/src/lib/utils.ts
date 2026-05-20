import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(iso);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: '#F39C12', accepted: '#3498DB', collecting: '#9B59B6',
    collected: '#2980B9', in_progress: '#E67E22', ready: '#27AE60',
    delivered: '#2ECC71', cancelled: '#E74C3C', declined: '#E74C3C',
  };
  return map[status] ?? '#8A9BB8';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending', accepted: 'Accepted', collecting: 'Collecting',
    collected: 'Collected', in_progress: 'In Progress', ready: 'Ready',
    delivered: 'Delivered', cancelled: 'Cancelled', declined: 'Declined',
  };
  return map[status] ?? status;
}
