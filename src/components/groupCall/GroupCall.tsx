"use client";

import { useEffect, useState, useRef } from "react";
import { Phone, PhoneOff, Video, Mic, MicOff, User, VideoOff } from "lucide-react";
import { socket } from "@/socket/socket";

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
  const [participants, setParticipants] = useState<any[]>([]);
  const [callStarted, setCallStarted] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const ringtone = useRef<HTMLAudioElement | null>(null);

  /** Load ringtone */
  useEffect(() => {
    ringtone.current = new Audio("/sounds/ringtone.mp3");
    ringtone.current.loop = true;
  }, []);

  /** Socket listeners */
  useEffect(() => {
    socket.on("incoming-group-call", handleIncomingCall);
    socket.on("group-call-participants", handleParticipantsUpdate);

    return () => {
      socket.off("incoming-group-call", handleIncomingCall);
      socket.off("group-call-participants", handleParticipantsUpdate);
    };
  }, []);

  /** Auto-initiate call if this user is the initiator */
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
    const payload = { chatroomId, initiatorId: userId, type: autoStart };
    socket.emit("group-call-initiate", payload);
    setCallStarted(true);
  };

  /** INCOMING CALL */
  const handleIncomingCall = (payload: any) => {
    const data = Array.isArray(payload) ? payload[0] : payload;
    if (data.initiatorId === userId) return; // ignore self
    setIsRinging(true);
    ringtone.current?.play().catch(() => {});
  };

  /** PARTICIPANTS UPDATE */
  const handleParticipantsUpdate = (payload: any) => {
    // Payload can be an array of participants
    const participantsList = Array.isArray(payload) ? payload : [];
    // Remove duplicates
    const uniqueParticipants = Array.from(
      new Map(participantsList.map((p: any) => [p.userId, p])).values()
    );
    setParticipants(uniqueParticipants);
  };

  /** ACCEPT CALL */
  const handleAccept = async () => {
    setIsRinging(false);
    ringtone.current?.pause();

    try {
      const constraints = { audio: true, video: autoStart === "video" };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && autoStart === "video") {
        localVideoRef.current.srcObject = stream;
      }

      socket.emit("group-call-join", { callId: incomingCall.callId, userId });
      setCallStarted(true);
    } catch (err) {
      console.error("Error starting call:", err);
    }
  };

  /** END CALL */
  const handleEndCall = () => {
    if (ringtone.current) ringtone.current.pause();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    socket.emit("group-call-leave", { callId: incomingCall?.callId, userId });
    setCallStarted(false);
    setShowGroupCall(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full p-4">
      {/* RINGING */}
      {isRinging && !callStarted && (
        <div className="flex flex-col items-center space-y-6">
          <User className="w-16 h-16 text-blue-500 animate-pulse" />
          <p className="text-lg font-semibold">Incoming {autoStart} call...</p>
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
          {autoStart === "video" && (
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
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                You
              </div>
              <span className="mt-1 text-sm text-center">You</span>
              {autoStart === "video" && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-20 h-20 rounded-lg mt-1"
                />
              )}
            </div>

            {/* Other participants */}
            {participants
              .filter(p => p.userId !== userId)
              .map((p, idx) => (
                <div key={`${p.userId}-${idx}`} className="flex flex-col items-center w-24">
                  <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-black dark:text-white font-semibold text-lg">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="mt-1 text-sm text-center">{p.username}</span>
                  {autoStart === "video" && (
                    <video
                      id={`remoteVideo-${p.userId}-${idx}`}
                      autoPlay
                      playsInline
                      className="w-20 h-20 rounded-lg mt-1 bg-black"
                    />
                  )}
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
