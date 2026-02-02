// hooks/useAuth.ts
import { useState, useEffect } from 'react';

interface User {
  id: string;
  role: string;
  firstName?: string;
  email?: string;
  // ... other user fields
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/protected', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          setUser(null);
          return;
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        if (token) {
          // Import your decryptToken function
          const payload = await decryptToken(token, secret);
          setUser(payload);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error getting user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  return { user, loading };
};
