// hooks/usePeerConnections.ts
import { useRef } from "react";

export function usePeerConnections(socket: any, callId: any, userId: any) {
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});

  const createPeer = (
    remoteUserId: string,
    isInitiator: boolean,
    stream: MediaStream | null = null
  ) => {
    const peer = new RTCPeerConnection();

    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("group-webrtc-candidate", {
          callId,
          candidate: event.candidate,
          fromUserId: userId,
        });
      }
    };

    peer.ontrack = (event) => {
      const remoteVideo = document.getElementById(
        `remoteVideo-${remoteUserId}`
      ) as HTMLVideoElement | null;
      if (remoteVideo) remoteVideo.srcObject = event.streams[0];
    };

    if (isInitiator) {
      peer.onnegotiationneeded = async () => {
        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("group-webrtc-offer", {
            callId,
            sdp: offer,
            fromUserId: userId,
          });
        } catch (err) {
          console.error("Failed to create/send offer:", err);
        }
      };
    }

    peersRef.current[remoteUserId] = peer;
    return peer;
  };

  const closeAllPeers = () => {
    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};
  };

  return { createPeer, peersRef, closeAllPeers };
}