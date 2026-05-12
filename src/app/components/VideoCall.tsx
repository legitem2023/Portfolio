'use client';

import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';

interface VideoCallProps {
  userId: string;
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
  isInitiator?: boolean; // Add this prop to determine if user initiates or receives call
  incomingCallData?: any; // Add this prop for pre-loaded incoming call data
}

// Logger utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`, data || '');
  }
};

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
  const [hasInitialized, setHasInitialized] = useState(false);
  
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

  // Log component mount and props
  useEffect(() => {
    logger.info('VideoCall component mounted', { 
      userId, 
      targetUserId, 
      targetUserName,
      isInitiator,
      hasIncomingData: !!incomingCallData,
      callId: callIdRef.current
    });
    
    return () => {
      logger.info('VideoCall component unmounting', { userId, targetUserId, callState });
    };
  }, []);

  // Initialize Pusher and listen for calls
  useEffect(() => {
    logger.info('Initializing Pusher connection', { userId });
    
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
      logger.error('Pusher key is missing!');
      return;
    }
    
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });

    pusherRef.current = pusher;
    const channelName = `private-user-${userId}`;
    const channel = pusher.subscribe(channelName);
    
    logger.info('Subscribed to Pusher channel', { channelName });

    // Handler for incoming calls (only listen if we're not the initiator)
    channel.bind('incoming-call', (data: any) => {
      logger.info('🔔 INCOMING CALL DETECTED via Pusher!', {
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        callId: data.callId,
        targetUserId,
        isTargetUser: data.fromUserId === targetUserId,
        isInitiator,
        timestamp: new Date().toISOString()
      });

      // Only handle incoming calls if we're not the initiator and it's from our target
      if (!isInitiator && data.fromUserId === targetUserId && callState === 'idle') {
        logger.info('✅ Valid incoming call from target user', { 
          targetUserId, 
          callId: data.callId,
          offerPresent: !!data.offer 
        });
        setIncomingCall(data);
        setCallState('ringing');
      } else if (isInitiator) {
        logger.info('Ignoring incoming call - component is in initiator mode');
      } else if (data.fromUserId !== targetUserId) {
        logger.warn('❌ Incoming call ignored - not from target user', {
          receivedFrom: data.fromUserId,
          expectedFrom: targetUserId
        });
      }
    });

    // Handler for call answered
    channel.bind('call-answered', async (data: any) => {
      logger.info('Call answered event received', {
        callId: data.callId,
        currentCallId: callIdRef.current,
        fromUserId: data.fromUserId
      });

      if (data.callId === callIdRef.current && isInitiator) {
        logger.info('Processing call answer', { callId: data.callId });
        await handleRemoteAnswer(data.answer);
      }
    });

    // Handler for ICE candidates
    channel.bind('ice-candidate', async (data: any) => {
      logger.debug('ICE candidate received', {
        callId: data.callId,
        hasCandidate: !!data.candidate,
        callIdMatches: data.callId === callIdRef.current
      });

      if (peerConnectionRef.current && data.candidate && data.callId === callIdRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          logger.debug('ICE candidate added successfully');
        } catch (error) {
          logger.error('Error adding ICE candidate:', error);
        }
      }
    });

    // Handler for call ended
    channel.bind('call-ended', (data: any) => {
      logger.info('Call ended event received', {
        callId: data.callId,
        currentCallId: callIdRef.current
      });

      if (data.callId === callIdRef.current) {
        logger.info('Ending current call due to remote end signal');
        endCall();
      }
    });

    // Log Pusher connection events
    pusher.connection.bind('connected', () => {
      logger.info('✅ Pusher connected successfully', { userId });
    });

    pusher.connection.bind('disconnected', () => {
      logger.warn('Pusher disconnected', { userId });
    });

    pusher.connection.bind('error', (error: any) => {
      logger.error('Pusher connection error', error);
    });

    return () => {
      logger.info('Cleaning up Pusher connection', { userId, channelName });
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [userId, targetUserId, isInitiator]);

  // Handle call initiation or acceptance based on role
  useEffect(() => {
    if (hasInitialized) return;
    
    if (isInitiator && callState === 'idle') {
      logger.info('Starting call as initiator');
      startCall();
      setHasInitialized(true);
    } else if (!isInitiator && incomingCall && callState === 'ringing') {
      logger.info('Waiting for user to accept incoming call');
      setHasInitialized(true);
    }
  }, [isInitiator, incomingCall, callState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const setupLocalStream = async () => {
    logger.info('Setting up local media stream');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      logger.info('Local media stream obtained successfully');
      return stream;
    } catch (error) {
      logger.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const createPeerConnection = (stream: MediaStream) => {
    logger.info('Creating RTCPeerConnection');
    const pc = new RTCPeerConnection(configuration);
    
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      logger.debug('Added track to peer connection', { trackKind: track.kind });
    });
    
    pc.ontrack = (event) => {
      logger.info('Received remote track', {
        trackKind: event.track.kind,
        streamCount: event.streams.length
      });
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        logger.info('Remote video element updated with stream');
      }
    };
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        logger.debug('ICE candidate generated');
        sendICECandidate(event.candidate);
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      logger.info('ICE connection state changed', { state: pc.iceConnectionState });
    };
    
    pc.onconnectionstatechange = () => {
      logger.info('Peer connection state changed', { state: pc.connectionState });
      
      if (pc.connectionState === 'connected') {
        logger.info('✅ Call connected successfully!');
        setCallState('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        logger.warn('Call disconnected or failed');
        endCall();
      }
    };
    
    return pc;
  };

  const sendICECandidate = async (candidate: RTCIceCandidate) => {
    try {
      await fetch('/api/call/ice-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: targetUserId,
          callId: callIdRef.current,
          candidate,
        }),
      });
      logger.debug('ICE candidate sent successfully');
    } catch (error) {
      logger.error('Failed to send ICE candidate', error);
    }
  };

  const startCall = async () => {
    if (callState !== 'idle') {
      logger.warn('Cannot start call - invalid state', { callState });
      return;
    }
    
    logger.info('Starting outbound call', {
      fromUserId: userId,
      toUserId: targetUserId,
      callId: callIdRef.current
    });
    
    try {
      const stream = await setupLocalStream();
      const pc = createPeerConnection(stream);
      peerConnectionRef.current = pc;
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      logger.info('Created WebRTC offer');
      setCallState('calling');
      
      const response = await fetch('/api/call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: userId,
          toUserId: targetUserId,
          callId: callIdRef.current,
          offer,
        }),
      });
      
      if (response.ok) {
        logger.info('Call initiation request sent successfully');
      } else {
        logger.error('Call initiation request failed', { status: response.status });
        endCall();
      }
    } catch (error) {
      logger.error('Error starting call:', error);
      endCall();
    }
  };

  const acceptCall = async () => {
    logger.info('Accepting incoming call', {
      fromUserId: incomingCall?.fromUserId,
      callId: incomingCall?.callId
    });
    
    if (!incomingCall) {
      logger.error('Cannot accept call - no incoming call data');
      return;
    }
    
    try {
      const stream = await setupLocalStream();
      const pc = createPeerConnection(stream);
      peerConnectionRef.current = pc;
      
      logger.info('Setting remote description from offer');
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      logger.info('Created and set local answer');
      
      const response = await fetch('/api/call/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: incomingCall.fromUserId,
          callId: incomingCall.callId,
          answer,
        }),
      });
      
      if (response.ok) {
        logger.info('Call answer sent successfully');
        setCallState('connected');
      } else {
        logger.error('Failed to send call answer', { status: response.status });
        endCall();
        return;
      }
      
      setIncomingCall(null);
      callIdRef.current = incomingCall.callId;
      
      logger.info('Call accepted, connection established');
    } catch (error) {
      logger.error('Error accepting call:', error);
      endCall();
    }
  };

  const handleRemoteAnswer = async (answer: RTCSessionDescriptionInit) => {
    logger.info('Handling remote answer');
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      logger.info('Remote description set successfully');
    } else {
      logger.error('No peer connection available for remote answer');
    }
  };

  const rejectCall = () => {
    logger.info('Rejecting incoming call');
    setIncomingCall(null);
    endCall();
  };

  const endCall = () => {
    logger.info('Ending call', { callId: callIdRef.current, callState });
    
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
    }).catch(error => logger.error('Failed to send call end notification', error));
    
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
      {incomingCall && callState === 'ringing' && !isInitiator && (
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

      {/* Video Call Modal */}
      {callState !== 'idle' && callState !== 'ended' && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <button
            onClick={endCall}
            className="absolute top-4 right-4 z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
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
            
            {(callState === 'calling' || (callState === 'ringing' && isInitiator)) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">
                  <div className="animate-pulse mb-4">
                    <Phone className="w-16 h-16 mx-auto animate-bounce" />
                  </div>
                  <p className="text-xl font-semibold">
                    {callState === 'calling' ? `Calling ${targetUserName}...` : 'Ringing...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-24 right-4 w-32 h-48 md:w-48 md:h-64 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white">
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

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </button>
              
              <button
                onClick={endCall}
                className="p-4 bg-red-500 rounded-full hover:bg-red-600 transition-all transform hover:scale-110"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                  isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
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
