// app/profile/[id]/page.tsx
'use client'
import React, { useState, useEffect } from 'react';
import PMTab from '../components/PMTab';
import { decryptToken } from '../../../utils/decryptToken';

export default function Page() {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
   
  useEffect(() => {
    const getRole = async () => {
      try {
        const response = await fetch('/api/protected', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        const payload = await decryptToken(token, secret.toString());
        setUserId(payload.userId);
        setName(payload.name);
        setAvatar(payload.image || "/NoImage.webp");
      } catch (err) {
        console.error('Error getting role:', err);
      }
    };
    getRole();
  }, []);
  return <PMTab UserId={userId} />;
}
