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
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const callIdRef = useRef<string>(incomingCallData?.callId || `${userId}-${targetUserId}-${Date.now()}`);
  const callStateRef = useRef<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>(callState);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
  };

  // Initialize Pusher
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });

    pusherRef.current = pusher;
    const channel = pusher.subscribe(`private-user-${userId}`);

    if (!isInitiator) {
      channel.bind('incoming-call', (data: any) => {
        console.log('Incoming call:', data);
        if (data.fromUserId === targetUserId && callStateRef.current === 'idle') {
          setIncomingCall(data);
          setCallState('ringing');
        }
      });
    }

    channel.bind('call-answered', async (data: any) => {
      console.log('Call answered:', data);
      if (data.callId === callIdRef.current && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('Remote description set');
        } catch (error) {
          console.error('Error setting remote description:', error);
        }
      }
    });

    channel.bind('ice-candidate', async (data: any) => {
      if (data.callId === callIdRef.current && data.candidate && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('ICE candidate added');
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

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

  useEffect(() => {
    if (isInitiator && callState === 'idle') {
      startCall();
    }
  }, [isInitiator]);

  const setupLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Don't autoplay, just set srcObject
      }
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setConnectionError('Cannot access camera/microphone');
      throw error;
    }
  };

  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(configuration);
    
    // Add local tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      console.log(`Added ${track.kind} track to peer connection`);
    });
    
    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('ONTRACK CALLBACK - Remote stream received!');
      const receivedStream = event.streams[0];
      setRemoteStream(receivedStream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = receivedStream;
        // Try to play with error handling
        const playPromise = remoteVideoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Play error (non-critical):', error.name);
            // Retry playing after a short delay
            setTimeout(() => {
              if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
                remoteVideoRef.current.play().catch(e => console.log('Retry play failed:', e.name));
              }
            }, 100);
          });
        }
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        fetch('/api/call/ice-candidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toUserId: targetUserId,
            callId: callIdRef.current,
            candidate: event.candidate,
          }),
        }).catch(console.error);
      }
    };
    
    // Monitor connection state with reconnection logic
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallState('connected');
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      } else if (pc.iceConnectionState === 'disconnected') {
        console.log('ICE disconnected, attempting to recover...');
        // Don't end call immediately, wait for recovery
        setTimeout(() => {
          if (peerConnectionRef.current?.iceConnectionState === 'disconnected') {
            console.log('ICE still disconnected, ending call');
            endCall();
          }
        }, 5000);
      } else if (pc.iceConnectionState === 'failed') {
        setConnectionError('Connection failed. Please try again.');
        endCall();
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected');
      } else if (pc.connectionState === 'disconnected') {
        console.log('Connection disconnected');
      } else if (pc.connectionState === 'failed') {
        setConnectionError('Connection failed');
        endCall();
      }
    };
    
    return pc;
  };

  const startCall = async () => {
    try {
      setConnectionError(null);
      const stream = await setupLocalStream();
      const pc = createPeerConnection(stream);
      peerConnectionRef.current = pc;
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('Offer created and set');
      
      setCallState('calling');
      
      await fetch('/api/call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: userId,
          toUserId: targetUserId,
          callId: callIdRef.current,
          offer: {
            type: offer.type,
            sdp: offer.sdp
          },
        }),
      });
      
      console.log('Initiate response: 200');
    } catch (error) {
      console.error('Error starting call:', error);
      setConnectionError('Failed to start call');
      endCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    
    try {
      setConnectionError(null);
      const stream = await setupLocalStream();
      const pc = createPeerConnection(stream);
      peerConnectionRef.current = pc;
      
      const offer = incomingCall.offer;
      if (!offer || !offer.sdp) {
        throw new Error('Invalid call offer');
      }
      
      console.log('Setting remote description with offer');
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      console.log('Creating answer');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('Answer created and set');
      
      await fetch('/api/call/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: incomingCall.fromUserId,
          callId: incomingCall.callId,
          answer: {
            type: answer.type,
            sdp: answer.sdp
          },
        }),
      });
      
      setIncomingCall(null);
      callIdRef.current = incomingCall.callId;
      console.log('Answer sent to caller');
    } catch (error) {
      console.error('Error accepting call:', error);
      setConnectionError('Failed to accept call');
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
    
    setRemoteStream(null);
    setLocalStream(null);
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
                className="flex-1 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-all"
              >
                <Phone className="w-5 h-5 inline mr-2" /> Accept
              </button>
              <button
                onClick={rejectCall}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-all"
              >
                <PhoneOff className="w-5 h-5 inline mr-2" /> Reject
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

          {/* Remote Video (Full screen) */}
          <div className="flex-1 relative bg-gray-900">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-white text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Waiting for video...</p>
                  {connectionError && (
                    <p className="text-red-400 text-sm mt-2">{connectionError}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Local Video PIP */}
          {localStream && (
            <div className="absolute bottom-24 right-4 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden border-2 border-white shadow-lg">
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
          )}

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
