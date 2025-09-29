// utils/webrtc.ts
export const createPeerConnection = (
  onTrack: (event: RTCTrackEvent) => void
): RTCPeerConnection => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.ontrack = onTrack;
  return pc;
};
