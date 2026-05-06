'use client';

import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';

interface VideoCallProps {
  userId: string;
  targetUserId?: string;
  onCallEnd?: () => void;
}

interface CallState {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  remoteUserId?: string;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  callId?: string;
}

export default function VideoCall({ userId, targetUserId, onCallEnd }: VideoCallProps) {
  const [callState, setCallState] = useState<CallState>({ status: 'idle' });
  const [incomingCall, setIncomingCall] = useState<any>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize Pusher
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {},
      },
    });

    pusherRef.current = pusher;

    // Subscribe to private channel for this user
    const channel = pusher.subscribe(`private-user-${userId}`);

    channel.bind('incoming-call', (data: any) => {
      setIncomingCall(data);
      setCallState(prev => ({ ...prev, status: 'ringing', remoteUserId: data.fromUserId }));
    });

    channel.bind('call-answered', async (data: any) => {
      if (data.callId === callState.callId) {
        await handleRemoteAnswer(data.answer);
      }
    });

    channel.bind('ice-candidate', async (data: any) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    channel.bind('call-ended', (data: any) => {
      if (data.callId === callState.callId) {
        endCall();
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-user-${userId}`);
      pusher.disconnect();
    };
  }, [userId]);

  // Set up local video stream
  const setupLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCallState(prev => ({ ...prev, localStream: stream }));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  // Create peer connection
  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(configuration);
    
    // Add local tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setCallState(prev => ({ ...prev, remoteStream }));
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && callState.callId) {
        sendICECandidate(event.candidate);
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, status: 'connected' }));
      } else if (pc.connectionState === 'disconnected') {
        endCall();
      }
    };
    
    return pc;
  };

  // Send ICE candidate via Pusher
  const sendICECandidate = async (candidate: RTCIceCandidate) => {
    if (!callState.remoteUserId || !callState.callId) return;
    
    await fetch('/api/call/ice-candidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toUserId: callState.remoteUserId,
        callId: callState.callId,
        candidate,
      }),
    });
  };

  // Start a call
  const startCall = async () => {
    try {
      const stream = await setupLocalStream();
      const callId = `${userId}-${targetUserId}-${Date.now()}`;
      const roomId = `room-${callId}`;
      
      const pc = createPeerConnection(stream);
      peerConnectionRef.current = pc;
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      setCallState(prev => ({ 
        ...prev, 
        status: 'calling', 
        callId,
        remoteUserId: targetUserId 
      }));
      
      // Send offer to target user
      await fetch('/api/call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: userId,
          toUserId: targetUserId,
          callId,
          roomId,
          offer,
        }),
      });
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;
    
    try {
      const stream = await setupLocalStream();
      const pc = createPeerConnection(stream);
      peerConnectionRef.current = pc;
      
      // Set remote description (offer)
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      
      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      setCallState(prev => ({ 
        ...prev, 
        status: 'connected', 
        callId: incomingCall.callId,
        remoteUserId: incomingCall.fromUserId 
      }));
      
      // Send answer back
      await fetch('/api/call/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: incomingCall.fromUserId,
          callId: incomingCall.callId,
          answer,
        }),
      });
      
      setIncomingCall(null);
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  // Handle remote answer
  const handleRemoteAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  // End call
  const endCall = () => {
    // Stop all tracks
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setCallState({ status: 'idle' });
    
    // Notify other party
    if (callState.callId && callState.remoteUserId) {
      fetch('/api/call/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: callState.remoteUserId,
          callId: callState.callId,
        }),
      });
    }
    
    onCallEnd?.();
  };

  const rejectCall = () => {
    setIncomingCall(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      {/* Incoming Call Modal */}
      {incomingCall && callState.status === 'ringing' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Incoming Call</h3>
            <p className="text-gray-600 mb-6">
              Call from User {incomingCall.fromUserId}
            </p>
            <div className="flex gap-4">
              <button
                onClick={acceptCall}
                className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
              >
                Accept
              </button>
              <button
                onClick={rejectCall}
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Call UI */}
      <div className="relative w-full max-w-6xl aspect-video bg-gray-800 rounded-lg overflow-hidden">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Call Controls */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
          {callState.status === 'idle' && targetUserId && (
            <button
              onClick={startCall}
              className="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition"
            >
              Start Call
            </button>
          )}
          
          {callState.status === 'calling' && (
            <button
              onClick={endCall}
              className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transition"
            >
              Cancel
            </button>
          )}
          
          {callState.status === 'connected' && (
            <button
              onClick={endCall}
              className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transition"
            >
              End Call
            </button>
          )}
        </div>
        
        {/* Status Indicator */}
        {callState.status !== 'connected' && callState.status !== 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              {callState.status === 'calling' && 'Calling...'}
              {callState.status === 'ringing' && 'Ringing...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
