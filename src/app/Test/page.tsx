'use client';
import { useAuth } from '../components/hooks/useAuth';

export default function TestPushButton() {
  const { user: ActiveDetails,loading } = useAuth();
  if(loading) return "Loading";
  const sendPush = async () => {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:ActiveDetails?.userId || "",
        title: 'Test Notification',
        body: 'This is a test!',
        interest: 'all-users'
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    alert(data.success ? '✅ Notification sent!' : '❌ Error: ' + data.error);
  };

  return (
    <button 
      onClick={sendPush}
      style={{ padding: '10px 20px', background: 'blue', color: 'white', borderRadius: '5px' }}
    >
      Send Test Push
    </button>
  );
}
