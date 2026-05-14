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
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('low');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const callIdRef = useRef<string>(incomingCallData?.callId || `${userId}-${targetUserId}-${Date.now()}`);
  const callStateRef = useRef<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>(callState);
  const senderRef = useRef<RTCRtpSender | null>(null);

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

  // Quality settings based on selection
  const getVideoConstraints = () => {
    switch(videoQuality) {
      case 'low':
        return {
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            frameRate: { ideal: 15 },
            aspectRatio: 4/3
          },
          audio: true
        };
      case 'medium':
        return {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 24 },
            aspectRatio: 4/3
          },
          audio: true
        };
      case 'high':
        return {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            aspectRatio: 16/9
          },
          audio: true
        };
      default:
        return { video: true, audio: true };
    }
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
      const constraints = getVideoConstraints();
      console.log(`Using ${videoQuality} quality video:`, constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      console.log('Local stream tracks:', stream.getTracks().map(t => `${t.kind} - ${t.getSettings().width}x${t.getSettings().height || 'N/A'}`));
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setConnectionError('Cannot access camera/microphone');
      throw error;
    }
  };

  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(configuration);
    
    // Add local tracks and save sender for bitrate control
    stream.getTracks().forEach(track => {
      const sender = pc.addTrack(track, stream);
      if (track.kind === 'video') {
        senderRef.current = sender;
        // Set low bitrate for better connection
        const params = sender.getParameters();
        if (params.encodings) {
          params.encodings[0].maxBitrate = videoQuality === 'low' ? 300000 : 
                                           videoQuality === 'medium' ? 500000 : 1000000;
          sender.setParameters(params);
        }
      }
      console.log(`Added ${track.kind} track to peer connection`);
    });
    
    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log(`ONTRACK: Received ${event.track.kind} track from remote`);
      const receivedStream = event.streams[0];
      setRemoteStream(receivedStream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = receivedStream;
        remoteVideoRef.current.play().catch(e => console.log('Play error:', e));
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
    
    // Monitor connection state
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallState('connected');
        setConnectionError(null);
      } else if (pc.iceConnectionState === 'failed') {
        setConnectionError('Connection failed');
        endCall();
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected');
      } else if (pc.connectionState === 'failed') {
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
      
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      
      console.log('Offer created with quality:', videoQuality);
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
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(answer);
      
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

  const changeQuality = (quality: 'low' | 'medium' | 'high') => {
    setVideoQuality(quality);
    // Restart stream with new quality
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setupLocalStream();
    }
  };

  return (
    <>
      {/* Incoming Call Modal */}
      {incomingCall && !isInitiator && callState === 'ringing' && (
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

          {/* Remote Video */}
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
                  <Phone className="w-16 h-16 mx-auto animate-bounce mb-4" />
                  <p className="text-xl">Connecting...</p>
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

          {/* Quality Selector */}
          <div className="absolute bottom-24 left-4 flex gap-2">
            <button
              onClick={() => changeQuality('low')}
              className={`px-3 py-1 rounded text-xs ${videoQuality === 'low' ? 'bg-blue-500' : 'bg-gray-700'} text-white`}
            >
              Low (320p)
            </button>
            <button
              onClick={() => changeQuality('medium')}
              className={`px-3 py-1 rounded text-xs ${videoQuality === 'medium' ? 'bg-blue-500' : 'bg-gray-700'} text-white`}
            >
              Medium (480p)
            </button>
            <button
              onClick={() => changeQuality('high')}
              className={`px-3 py-1 rounded text-xs ${videoQuality === 'high' ? 'bg-blue-500' : 'bg-gray-700'} text-white`}
            >
              High (720p)
            </button>
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
