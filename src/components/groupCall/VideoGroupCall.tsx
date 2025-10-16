import { useEffect, useState, useRef } from "react";
import { Phone, PhoneOff, Video, Mic, MicOff, User, VideoOff } from "lucide-react";
import { socket } from "@/socket/socket";

type Participant = {
  userId: number;
  username: string;
  stream?: MediaStream;
};

type GroupCallProps = {
  userId: number;
  chatroomId: string;
  type?: "audio" | "video"; // audio or video
  incomingCall?: any;
  setShowGroupCall: (val: boolean) => void;
};

export default function GroupCall({
  userId,
  chatroomId,
  type = "audio",
  incomingCall,
  setShowGroupCall,
}: GroupCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(type === "video");
  const [isRinging, setIsRinging] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [callStarted, setCallStarted] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const ringtone = useRef<HTMLAudioElement | null>(null);
  const peersRef = useRef<{ [userId: number]: RTCPeerConnection }>({});
  const remoteStreamsRef = useRef<{ [userId: number]: MediaStream }>({});

  /** Load ringtone */
  useEffect(() => {
    ringtone.current = new Audio("/ringtone.mp3");
    ringtone.current.loop = true;
  }, []);

  /** Socket listeners */
  useEffect(() => {
    socket.on("incoming-group-call", handleIncomingCall);
    socket.on("group-call-participants", handleParticipantsUpdate);
    socket.on("group-webrtc-offer", handleOffer);
    socket.on("group-webrtc-answer", handleAnswer);
    socket.on("group-webrtc-candidate", handleCandidate);
    return () => {
      socket.off("incoming-group-call", handleIncomingCall);
      socket.off("group-call-participants", handleParticipantsUpdate);
      socket.off("group-webrtc-offer", handleOffer);
      socket.off("group-webrtc-answer", handleAnswer);
      socket.off("group-webrtc-candidate", handleCandidate);
    };
  }, []);

  /** Auto-start call if user is initiator */
  useEffect(() => {
    if (!incomingCall) {
      initiateCall();
    } else {
      setIsRinging(true);
      ringtone.current?.play().catch(() => {});
    }
  }, []);

  /** INITIATE CALL */
  const initiateCall = () => {
    const payload = { chatroomId, initiatorId: userId, type };
    socket.emit("group-call-initiate", payload);
    setCallStarted(true);
  };

  /** INCOMING CALL */
  const handleIncomingCall = (payload: any) => {
    const data = Array.isArray(payload) ? payload[0] : payload;
    if (data.initiatorId === userId) return;
    setIsRinging(true);
    ringtone.current?.play().catch(() => {});
  };

  /** PARTICIPANTS UPDATE */
  const handleParticipantsUpdate = (payload: any) => {
    const participantsList: Participant[] = Array.isArray(payload) ? payload : [];
    const uniqueParticipants = Array.from(new Map(participantsList.map(p => [p.userId, p])).values());
    setParticipants(uniqueParticipants);

    if (callStarted && localStreamRef.current) {
      const newIds = uniqueParticipants.map(p => p.userId).filter(id => id !== userId && !peersRef.current[id]);
      initiatePeerConnections(newIds);
    }
  };

  /** PEER CONNECTION */
  const createPeerConnection = (otherUserId: number) => {
    if (peersRef.current[otherUserId]) return peersRef.current[otherUserId];
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    localStreamRef.current?.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
    const remoteStream = new MediaStream();
    remoteStreamsRef.current[otherUserId] = remoteStream;
    pc.ontrack = event => {
      event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
      setParticipants(prev =>
        prev.map(p => (p.userId === otherUserId ? { ...p, stream: remoteStream } : p))
      );
    };
    pc.onicecandidate = event => {
      if (event.candidate && incomingCall) {
        socket.emit("group-webrtc-candidate", {
          callId: incomingCall.callId,
          candidate: event.candidate,
          fromUserId: userId,
        });
      }
    };
    peersRef.current[otherUserId] = pc;
    return pc;
  };

  const initiatePeerConnections = async (participantIds: number[]) => {
    if (!incomingCall) return;
    for (let otherUserId of participantIds) {
      if (otherUserId === userId) continue;
      const pc = createPeerConnection(otherUserId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("group-webrtc-offer", { callId: incomingCall.callId, sdp: offer, fromUserId: userId });
    }
  };

  /** SIGNALING */
  const handleOffer = async ({ callId, sdp, fromUserId }: any) => {
    if (fromUserId === userId || callId !== incomingCall?.callId) return;
    const pc = createPeerConnection(fromUserId);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("group-webrtc-answer", { callId, sdp: answer, fromUserId: userId });
  };
  const handleAnswer = async ({ callId, sdp, fromUserId }: any) => {
    if (callId !== incomingCall?.callId) return;
    const pc = peersRef.current[fromUserId];
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  };
  const handleCandidate = ({ callId, candidate, fromUserId }: any) => {
    if (callId !== incomingCall?.callId) return;
    const pc = peersRef.current[fromUserId];
    if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  /** ACCEPT CALL */
  const handleAccept = async () => {
    setIsRinging(false);
    ringtone.current?.pause();
    try {
      const constraints = { audio: true, video: type === "video" };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current && type === "video") localVideoRef.current.srcObject = stream;
      socket.emit("group-call-join", { callId: incomingCall.callId, userId });
      setCallStarted(true);
    } catch (err) {
      console.error("Error starting call:", err);
    }
  };

  /** END CALL */
  const handleEndCall = () => {
    ringtone.current?.pause();
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    remoteStreamsRef.current = {};
    socket.emit("group-call-leave", { callId: incomingCall?.callId, userId });
    setCallStarted(false);
    setIsMuted(false);
    setIsVideoOn(type === "video");
    setShowGroupCall(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full p-4">
      {/* RINGING */}
      {isRinging && !callStarted && (
        <div className="flex flex-col items-center space-y-6">
          <User className="w-16 h-16 text-blue-500 animate-pulse" />
          <p className="text-lg font-semibold">
            Incoming {type} call... from {incomingCall?.chatroomName}
          </p>
          <p className="text-md italic">Call by {incomingCall?.initiatorName}</p>
          <div className="flex gap-4">
            <button
              onClick={handleAccept}
              className="p-3 bg-green-500 rounded-full hover:bg-green-600 transition"
            >
              <Phone className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={handleEndCall}
              className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* CALL ACTIVE */}
      {callStarted && (
        <div className="flex flex-col items-center w-full h-full">
          {/* Local Video */}
          {type === "video" && (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="rounded-lg w-64 h-40 shadow-lg mb-4"
            />
          )}

          {/* Participants */}
          <div className="flex flex-wrap justify-center gap-4">
            {/* You */}
            <div className="flex flex-col items-center w-24">
              {type === "video" ? (
                <video
                  ref={el => { if (el && localStreamRef.current) el.srcObject = localStreamRef.current }}
                  autoPlay
                  muted
                  playsInline
                  className="w-20 h-20 rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  You
                </div>
              )}
              <span className="mt-1 text-sm text-center">You</span>
            </div>

            {/* Other participants */}
            {participants.filter(p => p.userId !== userId).map(p => (
              <div key={p.userId} className="flex flex-col items-center w-24">
                {type === "video" && p.stream ? (
                  <video
                    ref={el => { if (el) el.srcObject = p.stream ?? null }}
                    autoPlay
                    playsInline
                    className="w-20 h-20 rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-black dark:text-white font-semibold text-lg">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="mt-1 text-sm text-center">{p.username}</span>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-5 mt-6">
            <button
              onClick={() => {
                if (localStreamRef.current) {
                  localStreamRef.current.getAudioTracks().forEach(track => {
                    track.enabled = !track.enabled;
                    setIsMuted(!track.enabled);
                  });
                }
              }}
              className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              {isMuted ? <MicOff className="w-6 h-6 text-red-500" /> : <Mic className="w-6 h-6 text-green-500" />}
            </button>

            {type === "video" && (
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

            <button
              onClick={handleEndCall}
              className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
