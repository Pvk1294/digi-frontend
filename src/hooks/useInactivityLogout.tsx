import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Set the timeout to 5 minutes in milliseconds
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

let inactivityTimer: NodeJS.Timeout;

export function useInactivityLogout() {
  const navigate = useNavigate();

  // This function clears the user's session and redirects to the login page
  const logout = useCallback(() => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    navigate('/login');
    console.log("User logged out due to inactivity.");
  }, [navigate]);

  // This function resets the 5-minute timer
  const resetTimer = useCallback(() => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logout, INACTIVITY_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    // A list of events that are considered user activity
    const activityEvents = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart' // Important for mobile
    ];

    // Add event listeners for all activity types
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start the timer when the component mounts
    resetTimer();

    // Cleanup function to remove listeners when the component unmounts
    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);
}