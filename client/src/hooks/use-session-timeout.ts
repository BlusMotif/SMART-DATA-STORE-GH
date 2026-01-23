import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useToast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const WARNING_TIME = 0; // No warning - silent logout after inactivity

export function useSessionTimeout() {
  const { logout, user } = useAuth();
  // Keep hook order stable; do not show prompts
  const { toast } = useToast();

  const timeoutRef = useRef<number>();
  const warningRef = useRef<number>();
  const lastActivityRef = useRef<number>(Date.now());
  const lastResetRef = useRef<number>(0);

  const resetTimer = useCallback(() => {
    // Throttle resets to prevent excessive timer updates
    const now = Date.now();
    if (now - lastResetRef.current < 1000) {
      return;
    }
    lastResetRef.current = now;
    lastActivityRef.current = now;

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Only set timers if user is logged in
    if (!user) return;

    // No warning prompts; silent logout only

    // Set logout timer
    timeoutRef.current = window.setTimeout(async () => {
      // Silent logout after inactivity
      await logout();
    }, INACTIVITY_TIMEOUT);
  }, [user, logout, toast]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Only enable session timeout if user is logged in
    if (!user) {
      // Clear timers if user logs out
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
      return;
    }

    // Start the timer initially
    resetTimer();

    // Activity event listeners
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'touchmove',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [user, handleActivity, resetTimer]);

  // Return current inactivity time for debugging (optional)
  const getTimeUntilLogout = useCallback(() => {
    if (!user) return null;
    const elapsed = Date.now() - lastActivityRef.current;
    return Math.max(0, INACTIVITY_TIMEOUT - elapsed);
  }, [user]);

  return {
    getTimeUntilLogout,
    resetTimer: handleActivity
  };
}