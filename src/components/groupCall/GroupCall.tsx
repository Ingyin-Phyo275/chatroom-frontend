// GroupCall.tsx
import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../socket/socket";

interface GroupCallProps {
  userId: string;
  chatroomId: string;
}

interface Participant {
  id: string;
}

interface IncomingCallPayload {
  callId: string;
  initiatorId: string;
  type: string;
}

interface WebRTCOfferPayload {
  callId: string;
  sdp: RTCSessionDescriptionInit;
  fromUserId: string;
}

interface WebRTCCandidatePayload {
  callId: string;
  candidate: RTCIceCandidateInit;
  fromUserId: string;
}

const GroupCall: React.FC<GroupCallProps> = ({ userId, chatroomId }) => {
  const [callId, setCallId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const localStreamRef = useRef<HTMLVideoElement | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});

  // Optional media fetch
  const getMediaStream = async (type: "video" | "audio" | "none") => {
    try {
      if (type === "none") return null;
      const constraints: MediaStreamConstraints = {
        video: type === "video",
        audio: type === "audio",
      };
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err: any) {
      console.warn("Media devices unavailable:", err);
      return null; // Continue without media
    }
  };

  // Socket debug
  useEffect(() => {
    socket.onAny((event, ...args) => console.log("[SOCKET EVENT]", event, args));
  }, []);

  useEffect(() => {
    const handleIncomingCall = ({ callId: incomingCallId }: IncomingCallPayload) => {
      joinCall(incomingCallId);
    };

    const handleParticipantJoined = ({ callId: joinedCallId, userId: joinedUserId }: { callId: string; userId: string }) => {
      if (joinedCallId === callId && joinedUserId !== userId) {
        const peer = createPeer(joinedUserId, true, localStreamRef.current?.srcObject as MediaStream | null);
        peersRef.current[joinedUserId] = peer;
        setParticipants(prev => [...prev, { id: joinedUserId }]);
      }
    };

    const handleWebRTCOffer = async ({ callId: incomingCallId, sdp, fromUserId }: WebRTCOfferPayload) => {
      if (incomingCallId !== callId) return;
      const peer = createPeer(fromUserId, false);
      await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("group-webrtc-answer", { callId, sdp: answer, fromUserId: userId });
    };

    const handleWebRTCAnswer = async ({ fromUserId, sdp }: WebRTCOfferPayload) => {
      const peer = peersRef.current[fromUserId];
      if (peer) await peer.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    const handleWebRTCCandidate = ({ fromUserId, candidate }: WebRTCCandidatePayload) => {
      const peer = peersRef.current[fromUserId];
      if (peer && candidate) peer.addIceCandidate(new RTCIceCandidate(candidate));
    };

    socket.on("incoming-group-call", handleIncomingCall);
    socket.on("group-call-joined", handleParticipantJoined);
    socket.on("group-webrtc-offer", handleWebRTCOffer);
    socket.on("group-webrtc-answer", handleWebRTCAnswer);
    socket.on("group-webrtc-candidate", handleWebRTCCandidate);

    return () => {
      socket.off("incoming-group-call", handleIncomingCall);
      socket.off("group-call-joined", handleParticipantJoined);
      socket.off("group-webrtc-offer", handleWebRTCOffer);
      socket.off("group-webrtc-answer", handleWebRTCAnswer);
      socket.off("group-webrtc-candidate", handleWebRTCCandidate);
    };
  }, [callId, userId]);

  // Peer creation
  const createPeer = (remoteUserId: string, isInitiator: boolean, stream: MediaStream | null = null) => {
    const peer = new RTCPeerConnection();

    if (stream) stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = event => {
      if (event.candidate) {
        socket.emit("group-webrtc-candidate", {
          callId,
          candidate: event.candidate,
          fromUserId: userId,
        });
      }
    };

    peer.ontrack = event => {
      const remoteVideo = document.getElementById(`remoteVideo-${remoteUserId}`) as HTMLVideoElement | null;
      if (remoteVideo) remoteVideo.srcObject = event.streams[0];
    };

    // Always create offer even if no local media
    if (isInitiator) {
      peer.onnegotiationneeded = async () => {
        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("group-webrtc-offer", { callId, sdp: offer, fromUserId: userId });
        } catch (err) {
          console.error("Failed to create/send offer:", err);
        }
      };
    }

    return peer;
  };

  // Start a call (audio/video/none)
  const startCall = async (type: "video" | "audio" | "none" = "none") => {
    const stream = await getMediaStream(type);
    if (stream && localStreamRef.current) localStreamRef.current.srcObject = stream;

    socket.emit("group-call-initiate", { initiatorId: userId, chatroomId, type });
    setError(null);
  };

  const joinCall = async (callIdToJoin: string) => {
    const stream = await getMediaStream("none"); // join silently if no devices
    if (stream && localStreamRef.current) localStreamRef.current.srcObject = stream;

    setCallId(callIdToJoin);
    socket.emit("group-call-join", { callId: callIdToJoin, userId });
    setError(null);
  };

  const leaveCall = () => {
    if (!callId) return;
    socket.emit("group-call-leave", { callId, userId });
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    setCallId(null);
    setParticipants([]);
    if (localStreamRef.current?.srcObject) {
      (localStreamRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      localStreamRef.current.srcObject = null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">Group Call</h2>

      {error && <div className="text-red-500 mb-2">{error}</div>}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => startCall("audio")}
          className="flex flex-col items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <span className="mb-1">📞</span>
          <span className="text-sm">Start Audio</span>
        </button>

        <button
          onClick={() => startCall("video")}
          className="flex flex-col items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          <span className="mb-1">🎥</span>
          <span className="text-sm">Start Video</span>
        </button>

        <button
          onClick={() => startCall("none")}
          className="flex flex-col items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          <span className="mb-1">💬</span>
          <span className="text-sm">Join Silent</span>
        </button>

        <button
          onClick={leaveCall}
          className="flex flex-col items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          <span className="mb-1">❌</span>
          <span className="text-sm">Leave Call</span>
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto">
        {/* Local Stream */}
        <div className="flex-shrink-0">
          <h3 className="text-sm mb-1">You</h3>
          <video
            ref={localStreamRef}
            autoPlay
            playsInline
            muted
            className="w-48 h-32 bg-black rounded"
          />
        </div>

        {/* Remote Participants */}
        {participants.map(p => (
          <div key={p.id} className="flex-shrink-0">
            <h3 className="text-sm mb-1">{p.id}</h3>
            <video
              id={`remoteVideo-${p.id}`}
              autoPlay
              playsInline
              className="w-48 h-32 bg-black rounded"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupCall;
