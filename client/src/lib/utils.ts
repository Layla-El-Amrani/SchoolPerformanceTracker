import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export const getColorByScore = (score: number): string => {
  if (score >= 80) return 'bg-secondary';
  if (score >= 70) return 'bg-primary';
  if (score >= 60) return 'bg-warning';
  return 'bg-error';
};

export const getTextColorByScore = (score: number): string => {
  if (score >= 80) return 'text-secondary';
  if (score >= 70) return 'text-primary';
  if (score >= 60) return 'text-warning';
  return 'text-error';
};

export const getColorForChange = (change: number): string => {
  return change >= 0 ? 'text-secondary' : 'text-error';
};

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
