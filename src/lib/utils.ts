import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function parseReminderPatterns(text: string): Array<{
  type: 'interval' | 'timeout' | 'scheduled';
  value: number;
  message: string;
  context: string;
}> {
  const reminders = [];
  
  // Interval patterns: "remind me every X minutes/hours/days"
  const intervalRegex = /remind me every (\d+) (minute|minutes|hour|hours|day|days)/i;
  const intervalMatch = text.match(intervalRegex);
  if (intervalMatch) {
    const [, amount, unit] = intervalMatch;
    const multipliers: Record<string, number> = {
      minute: 60 * 1000,
      minutes: 60 * 1000,
      hour: 60 * 60 * 1000,
      hours: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    };
    reminders.push({
      type: 'interval' as const,
      value: parseInt(amount) * multipliers[unit],
      message: `Remind me every ${amount} ${unit}`,
      context: text,
    });
  }
  
  // Timeout patterns: "remind me in X minutes/hours/days"
  const timeoutRegex = /remind me in (\d+) (minute|minutes|hour|hours|day|days)/i;
  const timeoutMatch = text.match(timeoutRegex);
  if (timeoutMatch) {
    const [, amount, unit] = timeoutMatch;
    const multipliers: Record<string, number> = {
      minute: 60 * 1000,
      minutes: 60 * 1000,
      hour: 60 * 60 * 1000,
      hours: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    };
    reminders.push({
      type: 'timeout' as const,
      value: parseInt(amount) * multipliers[unit],
      message: `Remind me in ${amount} ${unit}`,
      context: text,
    });
  }
  
  // Scheduled patterns: "remind me at X PM/AM" or "remind me at HH:MM"
  const scheduledRegex = /remind me at (\d{1,2}(:\d{2})?\s?(am|pm|AM|PM)?)/i;
  const scheduledMatch = text.match(scheduledRegex);
  if (scheduledMatch) {
    const timeStr = scheduledMatch[1];
    const now = new Date();
    const targetDate = new Date();
    
    // Parse time string
    if (timeStr.includes(':')) {
      // HH:MM format
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes);
      targetDate.setHours(hour, minute, 0, 0);
    } else {
      // Simple hour format with AM/PM
      const hour = parseInt(timeStr);
      const isPM = timeStr.toLowerCase().includes('pm');
      targetDate.setHours(isPM && hour < 12 ? hour + 12 : hour, 0, 0, 0);
    }
    
    // If target time is earlier than now, schedule for tomorrow
    if (targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    reminders.push({
      type: 'scheduled' as const,
      value: targetDate.getTime(),
      message: `Remind me at ${timeStr}`,
      context: text,
    });
  }
  
  return reminders;
}

export function encryptApiKey(apiKey: string): string {
  // Simple obfuscation for localStorage (not true encryption)
  // In production, use proper encryption
  return btoa(apiKey);
}

export function decryptApiKey(encryptedKey: string): string {
  try {
    return atob(encryptedKey);
  } catch {
    return '';
  }
}
