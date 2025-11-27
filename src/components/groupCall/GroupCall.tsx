"use client";

import { useEffect, useState, useRef } from "react";
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, User } from "lucide-react";
import { socket } from "@/socket/socket";

type Participant = {
  userId: number;
  username: string;
  stream?: MediaStream;
};

type GroupCallProps = {
  userId: number;
  chatroomId: string;
  autoStart?: "audio" | "video";
  incomingCall?: any;
  setShowGroupCall: (val: boolean) => void;
};

export default function GroupCall({
  userId,
  chatroomId,
  autoStart = "audio",
  incomingCall,
  setShowGroupCall,
}: GroupCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(autoStart === "video");
  const [isRinging, setIsRinging] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [incomingCallData, setIncomingCallData] = useState<any>(incomingCall || null);
  const [speakingMap, setSpeakingMap] = useState<{ [userId: number]: boolean }>({});

  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const ringtone = useRef<HTMLAudioElement | null>(null);
  const peersRef = useRef<{ [userId: number]: RTCPeerConnection }>({});
  const remoteStreamsRef = useRef<{ [userId: number]: MediaStream }>({});
  const participantAudioRefs = useRef<{ [userId: number]: HTMLAudioElement | null }>({});
  const hasInitiatedCall = useRef(false);
  const isCaller = !incomingCall;

  useEffect(() => {
    ringtone.current = new Audio("/rington.mp3");
    ringtone.current.loop = true;
  }, []);

  useEffect(() => {
    socket.on("incoming-group-call", handleIncomingCall);
    socket.on("group-call-participants", handleParticipantsUpdate);
    socket.on("group-call-created", handleCallCreated);
    socket.on("group-webrtc-offer", handleOffer);
    socket.on("group-webrtc-answer", handleAnswer);
    socket.on("group-webrtc-candidate", handleCandidate);

    return () => {
      socket.off("incoming-group-call", handleIncomingCall);
      socket.off("group-call-participants", handleParticipantsUpdate);
      socket.off("group-call-created", handleCallCreated);
      socket.off("group-webrtc-offer", handleOffer);
      socket.off("group-webrtc-answer", handleAnswer);
      socket.off("group-webrtc-candidate", handleCandidate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!incomingCallData && isCaller && !hasInitiatedCall.current) {
      initiateCall();
      hasInitiatedCall.current = true;
    } else if (incomingCallData?.initiatorId !== userId) {
      setIsRinging(true);
      ringtone.current?.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCallData]);

  const handleCallCreated = (payload: any) => {
    setIncomingCallData(payload);
  };

  const handleIncomingCall = (payload: any) => {
    const data = Array.isArray(payload) ? payload[0] : payload;
    if (data.initiatorId === userId) return;
    setIncomingCallData(data);
    setIsRinging(true);
    ringtone.current?.play().catch(() => {});
  };

  const handleParticipantsUpdate = (payload: any) => {
    const participantsList: Participant[] = Array.isArray(payload) ? payload : [];
    const uniqueParticipants = Array.from(new Map(participantsList.map(p => [p.userId, p])).values());
    setParticipants(uniqueParticipants);

    // after updating participants, if call already started, create connections to new ones
    if (callStarted && localStreamRef.current) {
      const newIds = uniqueParticipants.map(p => p.userId).filter(id => id !== userId && !peersRef.current[id]);
      initiatePeerConnections(newIds);
    }
  };

  const createPeerConnection = (otherUserId: number) => {
    if (peersRef.current[otherUserId]) return peersRef.current[otherUserId];

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    // Add existing local tracks (if any) to this peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          pc.addTrack(track, localStreamRef.current!);
        } catch (e) {
          // ignore if already added
        }
      });
    }

    // Prepare remote stream container
    const remoteStream = new MediaStream();
    remoteStreamsRef.current[otherUserId] = remoteStream;

    pc.ontrack = event => {
      // Attach incoming tracks to the remoteStream
      if (event.streams && event.streams[0]) {
        // prefer using provided stream
        const incoming = event.streams[0];
        remoteStreamsRef.current[otherUserId] = incoming;
        setParticipants(prev => prev.map(p => (p.userId === otherUserId ? { ...p, stream: incoming } : p)));
        // attach to audio element if present
        const audioEl = participantAudioRefs.current[otherUserId];
        if (audioEl) {
          audioEl.srcObject = incoming;
          audioEl.play().catch(() => {});
        }
      } else {
        // fallback: collect tracks into our remoteStream
        event.track && remoteStream.addTrack(event.track);
        setParticipants(prev => prev.map(p => (p.userId === otherUserId ? { ...p, stream: remoteStream } : p)));
        const audioEl = participantAudioRefs.current[otherUserId];
        if (audioEl) {
          audioEl.srcObject = remoteStream;
          audioEl.play().catch(() => {});
        }
      }
    };

    pc.onicecandidate = event => {
      if (event.candidate && incomingCallData) {
        // include toUserId so server can route candidate correctly if needed
        socket.emit("group-webrtc-candidate", {
          callId: incomingCallData.callId,
          candidate: event.candidate,
          fromUserId: userId,
          toUserId: otherUserId,
        });
      }
    };

    peersRef.current[otherUserId] = pc;
    return pc;
  };

  const initiatePeerConnections = async (participantIds: number[]) => {
    if (!incomingCallData) return;
    for (let otherUserId of participantIds) {
      if (otherUserId === userId) continue;
      const pc = createPeerConnection(otherUserId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("group-webrtc-offer", {
          callId: incomingCallData.callId,
          sdp: offer,
          fromUserId: userId,
          toUserId: otherUserId,
        });
      } catch (err) {
        console.error("Failed creating/sending offer to", otherUserId, err);
      }
    }
  };

  const handleOffer = async ({ callId, sdp, fromUserId }: any) => {
    if (fromUserId === userId || callId !== incomingCallData?.callId) return;
    const pc = createPeerConnection(fromUserId);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("group-webrtc-answer", { callId, sdp: answer, fromUserId: userId, toUserId: fromUserId });
    } catch (err) {
      console.error("handleOffer error:", err);
    }
  };

  const handleAnswer = async ({ callId, sdp, fromUserId }: any) => {
    if (callId !== incomingCallData?.callId) return;
    const pc = peersRef.current[fromUserId];
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (err) {
        console.error("handleAnswer setRemoteDescription error:", err);
      }
    }
  };

  const handleCandidate = ({ callId, candidate, fromUserId }: any) => {
    if (callId !== incomingCallData?.callId) return;
    const pc = peersRef.current[fromUserId];
    if (pc && candidate) {
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
        console.warn("addIceCandidate failed", err);
      });
    }
  };

  const initiateCall = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } as any,
        video: autoStart === "video",
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (autoStart === "video" && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.emit("group-call-initiate", { chatroomId, initiatorId: userId, type: autoStart });
      setCallStarted(true);

      // If participants already known (unlikely at initiate) - create peers
      const otherIds = participants.map(p => p.userId).filter(id => id !== userId);
      if (otherIds.length) initiatePeerConnections(otherIds);
    } catch (err) {
      console.error("Error accessing local media:", err);
    }
  };

  const handleAccept = async () => {
    setIsRinging(false);
    stopRingtone();
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } as any,
        video: autoStart === "video",
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (autoStart === "video" && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.emit("group-call-join", { callId: incomingCallData.callId, userId });
      setCallStarted(true);
    } catch (err) {
      console.error("Error starting call:", err);
    }
  };

  const handleEndCall = () => {
    stopRingtone();
    // stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    localStreamRef.current = null;

    // close peers
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    remoteStreamsRef.current = {};

    // clear audio elements
    Object.values(participantAudioRefs.current).forEach(el => {
      if (el) {
        try {
          el.pause();
          el.srcObject = null;
        } catch (e) {}
      }
    });
    participantAudioRefs.current = {};

    socket.emit("group-call-leave", { callId: incomingCallData?.callId, userId });

    setCallStarted(false);
    setIsMuted(false);
    setIsVideoOn(autoStart === "video");
    setShowGroupCall(false);
    setParticipants([]);
  };

  const stopRingtone = () => {
    if (ringtone.current) {
      ringtone.current.pause();
      ringtone.current.currentTime = 0;
    }
  };

  const toggleMuteMic = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (!track) return;
    // flip enabled state
    const newEnabled = !track.enabled;
    track.enabled = newEnabled;
    // isMuted should reflect "muted" state
    setIsMuted(!newEnabled);

    // NOTE: toggling enabled is usually fine. If your server/peers require renegotiation
    // when tracks are disabled/removed, you'll need to trigger renegotiation / re-offer here.
  };

  // Ensure participant audio elements are updated when participants or their streams change
  useEffect(() => {
    participants.forEach(p => {
      if (p.userId === userId) return;
      const audioEl = participantAudioRefs.current[p.userId];
      const stream = p.stream ?? remoteStreamsRef.current[p.userId];
      if (audioEl && stream) {
        audioEl.srcObject = stream;
        audioEl.play().catch(() => {});
      }
    });
  }, [participants]);

  /** SPEAKING DETECTION (keeps your previous logic, but guard against null streams) */
  useEffect(() => {
    if (!localStreamRef.current && participants.length === 0) return;

    const audioContexts: { [userId: number]: AudioContext } = {};
    const analysers: { [userId: number]: AnalyserNode } = {};
    const dataArrays: { [userId: number]: Uint8Array } = {};
    let rafIds: { [userId: number]: number } = {};

    const allParticipants = participants.concat([{ userId, username: "You", stream: localStreamRef.current ?? undefined }]);

    allParticipants.forEach(p => {
      if (!p.stream) return;

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(p.stream);
        source.connect(analyser);
        analyser.fftSize = 512;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        audioContexts[p.userId] = audioContext;
        analysers[p.userId] = analyser;
        dataArrays[p.userId] = dataArray;

        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setSpeakingMap(prev => ({ ...prev, [p.userId]: avg > 20 }));
          rafIds[p.userId] = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch (err) {
        // can't create audio context - ignore for this participant
        console.warn("speaking detection error for user", p.userId, err);
      }
    });

    return () => {
      Object.values(rafIds).forEach(id => cancelAnimationFrame(id));
      Object.values(audioContexts).forEach(ctx => ctx.close());
    };
  }, [participants, localStreamRef.current]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full p-4">
      {!isCaller && isRinging && !callStarted && (
        <div className="flex flex-col items-center space-y-6">
          <User className="w-16 h-16 text-blue-500 animate-pulse" />
          <p className="text-lg font-semibold">
            Incoming {autoStart} call... from {incomingCallData?.chatroomName}
          </p>
          <p className="text-md italic">Call by {incomingCallData?.initiatorName}</p>
          <div className="flex gap-4">
            <button onClick={handleAccept} className="p-3 bg-green-500 rounded-full hover:bg-green-600 transition">
              <Phone className="w-6 h-6 text-white" />
            </button>
            <button onClick={handleEndCall} className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition">
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {isCaller && !callStarted && (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg font-semibold">Calling...</p>
          <p className="text-md italic">Waiting for participants to join</p>
          <button onClick={handleEndCall} className="p-3 bg-red-500 rounded-full">
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {callStarted && (
        <div className="flex flex-col items-center w-full h-full">
          {autoStart === "video" && (
            <video ref={localVideoRef} autoPlay muted playsInline className="rounded-lg w-64 h-40 shadow-lg mb-4" />
          )}

          <div className="flex flex-wrap justify-center gap-4">
            {participants
              .filter(p => p.userId !== userId)
              .concat([{ userId, username: "You", stream: localStreamRef.current ?? undefined }])
              .map(p => (
                <div key={p.userId} className="flex flex-col items-center w-24">
                  <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full relative flex items-center justify-center text-black dark:text-white font-semibold text-lg">
                    {p.username.charAt(0).toUpperCase()}
                    <Mic className={`absolute bottom-0 right-0 w-5 h-5 ${speakingMap[p.userId] ? "text-green-500 animate-pulse" : "text-gray-400"}`} />
                  </div>
                  <span className="mt-1 text-sm text-center">{p.username}</span>

                  {p.stream && autoStart === "video" && (
                    <video
                      ref={el => {
                        if (el) el.srcObject = p.stream ?? null;
                      }}
                      autoPlay
                      playsInline
                      className="w-20 h-20 rounded-lg mt-1"
                    />
                  )}

                  {/* audio element for audio-only participants */}
                  {autoStart === "audio" && (
                    <audio
                      ref={el => {
                        // store element for later use
                        participantAudioRefs.current[p.userId] = el;
                        // attach stream if present
                        const stream = p.stream ?? remoteStreamsRef.current[p.userId];
                        if (el && stream) {
                          el.srcObject = stream;
                          // ensure playback attempt
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                    />
                  )}
                </div>
              ))}
          </div>

          <div className="flex gap-5 mt-6">
            <button onClick={toggleMuteMic} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              {isMuted ? <MicOff className="w-6 h-6 text-red-500" /> : <Mic className="w-6 h-6 text-green-500" />}
            </button>

            {autoStart === "video" && (
              <button
                onClick={() => {
                  if (localStreamRef.current) {
                    const videoTrack = localStreamRef.current.getVideoTracks()[0];
                    if (videoTrack) {
                      videoTrack.enabled = !videoTrack.enabled;
                      setIsVideoOn(videoTrack.enabled);
                    }
                  }
                }}
                className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {isVideoOn ? <Video className="w-6 h-6 text-green-500" /> : <VideoOff className="w-6 h-6 text-red-500" />}
              </button>
            )}

            <button onClick={handleEndCall} className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition">
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
