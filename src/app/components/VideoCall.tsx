'use client';

import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';

interface VideoCallProps {
  userId: string;
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
  isInitiator?: boolean;
  incomingCallData?: any;
}

export default function VideoCall({ 
  userId, 
  targetUserId, 
  targetUserName, 
  onClose,
  isInitiator = true,
  incomingCallData = null
}: VideoCallProps) {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(incomingCallData);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const callIdRef = useRef<string>(incomingCallData?.callId || `${userId}-${targetUserId}-${Date.now()}`);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  // Initialize Pusher and listen for calls
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });

    pusherRef.current = pusher;
    const channel = pusher.subscribe(`private-user-${userId}`);

    // Listen for incoming calls (only if not initiator)
    if (!isInitiator) {
      channel.bind('incoming-call', (data: any) => {
       console.log(data.fromUserId,"<<<>>>",targetUserId);
        if (data.fromUserId === targetUserId && callState === 'idle') {
          setIncomingCall(data);
          setCallState('ringing');
          console.log('ringing');
        }
      });
    }

    // Listen for call answer
    channel.bind('call-answered', async (data: any) => {
      if (data.callId === callIdRef.current && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    // Listen for ICE candidates
    channel.bind('ice-candidate', async (data: any) => {
      if (peerConnectionRef.current && data.candidate && data.callId === callIdRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    // Listen for call end
    channel.bind('call-ended', (data: any) => {
      if (data.callId === callIdRef.current) {
        endCall();
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-user-${userId}`);
      pusher.disconnect();
    };
  }, [userId, targetUserId, isInitiator]);

  // Auto-start call if initiator
  useEffect(() => {
    if (isInitiator && callState === 'idle') {
      startCall();
    }
  }, [isInitiator]);

  const setupLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(configuration);
    
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        fetch('/api/call/ice-candidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toUserId: targetUserId,
            callId: callIdRef.current,
            candidate: event.candidate,
          }),
        });
      }
    };
    
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };
    
    return pc;
  };

  const startCall = async () => {
    try {
      const stream = await setupLocalStream();
      const pc = createPeerConnection(stream);
      peerConnectionRef.current = pc;
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      setCallState('calling');
      
      await fetch('/api/call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: userId,
          toUserId: targetUserId,
          callId: callIdRef.current,
          offer,
        }),
      });
    } catch (error) {
      console.error('Error starting call:', error);
      endCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    
    try {
      const stream = await setupLocalStream();
      const pc = createPeerConnection(stream);
      peerConnectionRef.current = pc;
      
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      await fetch('/api/call/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: incomingCall.fromUserId,
          callId: incomingCall.callId,
          answer,
        }),
      });
      
      setCallState('connected');
      setIncomingCall(null);
      callIdRef.current = incomingCall.callId;
    } catch (error) {
      console.error('Error accepting call:', error);
      endCall();
    }
  };

  const rejectCall = () => {
    setIncomingCall(null);
    endCall();
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    fetch('/api/call/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toUserId: targetUserId,
        callId: callIdRef.current,
      }),
    }).catch(console.error);
    
    setCallState('ended');
    onClose();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };
 console.log(incomingCall,callState === 'ringing',isInitiator);
  return (
    <>
      {/* Incoming Call Modal */}
      {incomingCall && !isInitiator && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Incoming Call</h3>
              <p className="text-gray-600">{targetUserName} is calling you...</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={acceptCall}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" /> Accept
              </button>
              <button
                onClick={rejectCall}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-5 h-5" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call UI */}
      {callState !== 'idle' && callState !== 'ended' && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <button
            onClick={endCall}
            className="absolute top-4 right-4 z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex-1 relative bg-gray-900">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {(callState === 'calling' || callState === 'ringing') && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">
                  <Phone className="w-16 h-16 mx-auto animate-bounce mb-4" />
                  <p className="text-xl font-semibold">
                    {callState === 'calling' ? `Calling ${targetUserName}...` : 'Ringing...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video PIP */}
          <div className="absolute bottom-24 right-4 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <VideoOff className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all hover:scale-110 ${
                  isMuted ? 'bg-red-500' : 'bg-gray-700'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </button>
              
              <button
                onClick={endCall}
                className="p-4 bg-red-500 rounded-full hover:bg-red-600 transition-all hover:scale-110"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all hover:scale-110 ${
                  isVideoOff ? 'bg-red-500' : 'bg-gray-700'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
              </button>
            </div>
            <p className="text-center text-white text-sm mt-3">
              {callState === 'connected' ? `Call with ${targetUserName}` : 'Connecting...'}
            </p>
          </div>
        </div>
      )}
    </>
  );
          }
