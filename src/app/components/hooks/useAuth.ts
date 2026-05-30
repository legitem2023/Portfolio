// hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { decryptToken } from '../../../../utils/decryptToken';
import { setupPushNotifications } from '../../../../utils/push-notification'; // Adjust path as needed

interface User {
  userId: string;
  role: string;
  name?: string;
  email?: string;
  phone: string; 
  image?: string;
  addresses: string[];
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user function - can be called manually to refresh
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/protected', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.status === 401) {
        setUser(null);
        return;
      }
      
      const data = await response.json();
      const token = data?.user;
      const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

      if (token) {
        const payload = await decryptToken(token, secret);
        setUser(payload);
        
        // ✅ Setup push notifications when user is successfully fetched/updated
        if (payload?.userId) {
          await setupPushNotifications(payload.userId);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error getting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Listen for token update events from AddressesTab or other components
  useEffect(() => {
    const handleTokenUpdate = (event: Event) => {
      console.log('Token update detected, refreshing user data...');
      
      // Optional: Get the new token from event detail if needed
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.token) {
        console.log('New token received, refreshing session');
      }
      
      // Refresh user data
      fetchUser();
    };
    
    // Listen for custom token update event
    window.addEventListener('auth-token-updated', handleTokenUpdate);
    
    // Also listen for NextAuth session updates as fallback
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'nextauth.message' || event.key?.includes('next-auth')) {
        console.log('NextAuth storage changed, refreshing user data...');
        fetchUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('auth-token-updated', handleTokenUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchUser]);

  // Optional: Poll for changes every 5 minutes (adjust as needed)
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Only poll if user is logged in and not already loading
      if (user && !loading) {
        console.log('Polling for user data updates...');
        fetchUser();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, [user, loading, fetchUser]);

  return { 
    user, 
    loading, 
    error,
    refetch: fetchUser,  // Expose manual refresh method
    isAuthenticated: !!user
  };
};
