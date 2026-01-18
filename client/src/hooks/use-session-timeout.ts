import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useToast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const WARNING_TIME = 60 * 1000; // Show warning 1 minute before logout

export function useSessionTimeout() {
  const { logout, user } = useAuth();
  const { toast } = useToast();

  const timeoutRef = useRef<number>();
  const warningRef = useRef<number>();
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Only set timers if user is logged in
    if (!user) return;

    // Set warning timer (4 minutes)
    warningRef.current = setTimeout(() => {
      toast({
        title: "Session Timeout Warning",
        description: "You will be logged out in 1 minute due to inactivity. Move your mouse or press a key to stay logged in.",
        variant: "destructive",
        duration: 10000, // Show for 10 seconds
      });
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set logout timer (5 minutes)
    timeoutRef.current = setTimeout(async () => {
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
        duration: 5000,
      });

      // Logout the user
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