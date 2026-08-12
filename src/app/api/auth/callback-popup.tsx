// pages/api/auth/callback-popup.tsx (or app/auth/callback/page.tsx)
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();
  
  useEffect(() => {
    // Send message to parent window that login is complete
    if (window.opener) {
      window.opener.postMessage({ type: 'GOOGLE_SIGNIN_SUCCESS' }, window.location.origin);
      window.close();
    } else {
      router.push('/Login');
    }
  }, [router]);
  
  return <div>Completing login, please wait...</div>;
}
