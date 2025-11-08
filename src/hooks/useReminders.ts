import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { Reminder } from '@/types';

export function useReminders() {
  const { reminders, apiKey, updateReminder, deleteReminder } = useChatStore();
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const triggerProactiveMessage = useCallback(async (reminder: Reminder) => {
    if (!apiKey) return;

    // For now, we'll add a simple system message
    // In a real implementation, you might want to handle this more elegantly
    const proactiveMessage = `⏰ Reminder: ${reminder.message}`;
    
    // Add as system message to current conversation or create new one
    if (apiKey) {
      try {
        // This would ideally be handled by the chat system
        console.log('Proactive reminder triggered:', proactiveMessage);
      } catch (error) {
        console.error('Failed to send proactive message:', error);
      }
    }
  }, [apiKey]);

  // Set up reminders
  useEffect(() => {
    // Clear existing timers
    intervalsRef.current.forEach((interval) => clearInterval(interval));
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    intervalsRef.current.clear();
    timeoutsRef.current.clear();

    // Set up new timers
    reminders.forEach((reminder) => {
      if (!reminder.isActive) return;

      if (reminder.type === 'interval') {
        const interval = setInterval(() => {
          triggerProactiveMessage(reminder);
        }, reminder.value);
        intervalsRef.current.set(reminder.id, interval);
      } else if (reminder.type === 'timeout') {
        const timeout = setTimeout(() => {
          triggerProactiveMessage(reminder);
          // Deactivate one-time reminders
          updateReminder(reminder.id, { isActive: false });
        }, reminder.value);
        timeoutsRef.current.set(reminder.id, timeout);
      } else if (reminder.type === 'scheduled') {
        const now = Date.now();
        const targetTime = reminder.value;
        
        if (targetTime > now) {
          const timeout = setTimeout(() => {
            triggerProactiveMessage(reminder);
            updateReminder(reminder.id, { isActive: false });
          }, targetTime - now);
          timeoutsRef.current.set(reminder.id, timeout);
        }
      }
    });

    const intervals = intervalsRef.current;
    const timeouts = timeoutsRef.current;
    
    return () => {
      intervals.forEach((interval) => clearInterval(interval));
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [reminders, triggerProactiveMessage, updateReminder]);

  const pauseReminder = useCallback((id: string) => {
    updateReminder(id, { isActive: false });
  }, [updateReminder]);

  const resumeReminder = useCallback((id: string) => {
    updateReminder(id, { isActive: true });
  }, [updateReminder]);

  const removeReminder = useCallback((id: string) => {
    // Clear any timers for this reminder
    const interval = intervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalsRef.current.delete(id);
    }

    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    deleteReminder(id);
  }, [deleteReminder]);

  return {
    reminders,
    pauseReminder,
    resumeReminder,
    removeReminder,
  };
}
