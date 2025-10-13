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
  const localStreamRef = useRef<HTMLVideoElement | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});

      useEffect(() => {
        socket.onAny((event, ...args) => {
            console.log("[SOCKET EVENT] in group chat", event, args);
        });
    }, []);

    
  useEffect(() => {
    const handleIncomingCall = ({ callId: incomingCallId }: IncomingCallPayload) => {
      console.log("Incoming call:", incomingCallId);
      joinCall(incomingCallId);
    };

    const handleParticipantJoined = ({ callId: joinedCallId, userId: joinedUserId }: { callId: string; userId: string }) => {
      console.log("User joined call:", joinedUserId);
      if (joinedUserId !== userId && joinedCallId === callId) {
        const peer = createPeer(joinedUserId, true, localStreamRef.current?.srcObject as MediaStream);
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

  const startCall = async (type: "video" | "audio" = "video") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });
    if (localStreamRef.current) localStreamRef.current.srcObject = stream;

    socket.emit("group-call-initiate", { initiatorId: userId, chatroomId, type });
  };

  const joinCall = async (callIdToJoin: string) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localStreamRef.current) localStreamRef.current.srcObject = stream;
    setCallId(callIdToJoin);

    socket.emit("group-call-join", { callId: callIdToJoin, userId });
  };

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

    if (isInitiator) {
      peer.onnegotiationneeded = async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("group-webrtc-offer", { callId, sdp: offer, fromUserId: userId });
      };
    }

    return peer;
  };

  const leaveCall = () => {
    if (!callId) return;
    socket.emit("group-call-leave", { callId, userId });
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    setCallId(null);
    setParticipants([]);
  };

  return (
    <div>
      <h2>Group Call</h2>
      <button onClick={() => startCall("video")}>Start Call</button>
      <button onClick={leaveCall}>Leave Call</button>

      <div>
        <h3>Local Stream</h3>
        <video ref={localStreamRef} autoPlay playsInline muted style={{ width: 300 }} />
      </div>

      <div>
        <h3>Participants</h3>
        {participants.map(p => (
          <video key={p.id} id={`remoteVideo-${p.id}`} autoPlay playsInline style={{ width: 300 }} />
        ))}
      </div>
    </div>
  );
};

export default GroupCall;
