import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusColor(status?: string, withShadow = false) {
  const baseColors = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
  };

  const shadowColors = {
    online: 'shadow-green-500/50',
    idle: 'shadow-yellow-500/50',
    dnd: 'shadow-red-500/50',
    offline: 'shadow-gray-500/50',
  };

  const key = (status as keyof typeof baseColors) || 'offline';
  const color = baseColors[key] || baseColors.offline;
  
  if (withShadow) {
    return `${color} ${shadowColors[key] || shadowColors.offline}`;
  }
  
  return color;
}
