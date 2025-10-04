 // components/LogoutButton.tsx
'use client';
import { useState } from 'react'

import { useRouter } from 'next/navigation'
import { useDispatch } from "react-redux"
import { setActiveIndex } from '../../../Redux/activeIndexSlice'
import { persistor } from '../../../Redux/store' // Import the persistor

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
 const router = useRouter()
  
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    const confirmLogout = confirm('Are you sure you want to logout?')
    if (!confirmLogout) {
      return
    }
    
    setIsLoggingOut(true)
    
    await signOut({
      redirect: true,
      callbackUrl: '/', // Redirect to home after logout
    });
   router.push('./Login');
  };
  
  return (
    <button 
      className={`w-full text-white bg-transparent-600 hover:bg-red-700 py-2 px-4 rounded-md transition-all duration-300 flex items-center justify-center ${
        isLoggingOut ? 'opacity-70 cursor-not-allowed' : ''
      }`}

      disabled={isLoggingOut}
      onClick={handleLogout}>
      Logout
    </button>
  );
}
