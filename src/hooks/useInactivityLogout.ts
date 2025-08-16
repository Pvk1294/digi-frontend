import { useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

let inactivityTimer: ReturnType<typeof setTimeout>;

export function useInactivityLogout() {
  const { logout } = useAuth();

  // FIX 2: Create a stable function to call logout, preventing re-renders
  const handleLogout = useCallback(() => {
    logout("You have been logged out due to inactivity.");
  }, [logout]);

  const resetTimer = useCallback(() => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);
}
