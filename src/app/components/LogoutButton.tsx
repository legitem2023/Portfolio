 // components/LogoutButton.tsx
'use client';
import { useState } from 'react'

import { useRouter } from 'next/navigation'
import { useDispatch } from "react-redux"
import { setActiveIndex } from '../../../Redux/activeIndexSlice'
import { persistor } from '../../../Redux/store' // Import the persistor
import { ChevronRight, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function LogoutButton() {
 const router = useRouter()
  
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    const confirmLogout = confirm('Are you sure you want to logout?')
    if (!confirmLogout) {
      return
    }
    
    setIsLoggingOut(true); 
    await signOut({
      redirect: true,
      callbackUrl: '/Login', // Redirect to Login after logout
    });
   router.push('/Login');
  };
  
  return (  
   <button
        className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-300 ease-out hover:pl-5 hover:shadow-sm"
        disabled={isLoggingOut}
        onClick={handleLogout}>
                    <LogOut className="mr-3 text-gray-400 w-5 h-5" />
                    <span className="flex-1 transition-all duration-300">Logout</span>
                    <ChevronRight className="text-gray-400 w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1" />
   </button>
  );
}
