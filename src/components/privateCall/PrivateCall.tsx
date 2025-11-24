import { useEffect, useState, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { socket } from "@/socket/socket";

type PrivateCallProps = {
  userId: number;
  receiver_id: number;
  incomingCall?: any;
  setShowCall: (val: boolean) => void;
};

export default function PrivateCall({
  userId,
  receiver_id,
  incomingCall,
  setShowCall,
}: PrivateCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callData, setCallData] = useState<any>(incomingCall || null);
  const [remoteOffer, setRemoteOffer] = useState<RTCSessionDescriptionInit | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtone = useRef<HTMLAudioElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const isCaller = !incomingCall;

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.autoplay = true;
    }
  }, []);

  const handleCallInitiated = ({ callData }: any) => {
    setCallData(callData);
  };

  //reject call
  useEffect(() => {
    const handleCallRejected = (payload: any) => {
      const callData = Array.isArray(payload) ? payload[0] : payload;
      console.log("Call rejected event received:", callData);

      // Stop local and remote streams
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerRef.current?.close();
      peerRef.current = null;
      localStreamRef.current = null;

      if (remoteAudioRef.current?.srcObject) {
        (remoteAudioRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
        remoteAudioRef.current.srcObject = null;
      }
      // Stop ringtone if playing
      ringtone.current?.pause();
      ringtone.current!.currentTime = 0;
      // Close call UI
      setShowCall(false);
      setIsRinging(false);
    };
    socket.on("private-call-rejected", handleCallRejected);
    return () => {
      socket.off("private-call-rejected", handleCallRejected);
    };
  }, []);


  useEffect(() => {
    socket.on("private-call-initiated", handleCallInitiated);
    return () => {
      socket.off("private-call-initiated", handleCallInitiated);
    };
  }, []);

  const receiverName = callData?.receiver?.username;
  const callerName = callData?.initiator?.username;

  // console.log("caller", callerName)
  // console.log("receiver name", receiverName)
  //console.log("name check", callerName, receiverName)
  useEffect(() => {
    ringtone.current = new Audio("/ringtone.mp3");
    ringtone.current.loop = true;
  }, []);

  useEffect(() => {
    socket.on("private-incoming-call", handleIncomingCall);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-candidate", handleCandidate);

    return () => {
      socket.off("private-incoming-call", handleIncomingCall);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-candidate", handleCandidate);
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStarted) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStarted]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // const handleIncomingCall = (payload: any) => {
  //   if (payload.from === userId) return;
  //   setCallData({
  //     ...payload.callData,
  //     from: payload.from,
  //     call_type: payload.call_type,
  //   });
  //   setIsRinging(true);
  //   ringtone.current?.play().catch(() => { });
  // };

const handleIncomingCall = (payload: any) => {
  const data = Array.isArray(payload) ? payload[0] : payload;
  console.log("handleIncomingCall", data, "userId", userId);

  if (!data) return;
  if (data.from === userId) {
    console.log("Incoming call ignored: from === userId");
    return;
  }

  setCallData({
    ...data.callData,
    from: data.from,
    call_type: data.call_type,
  });

  setIsRinging(true);
  ringtone.current?.play().catch(() => {});
};



  const handleOffer = async ({ sdp, from }: any) => {
    if (from === userId) return;

    // Normalize the incoming SDP
    const offerDesc =
      typeof sdp === "string"
        ? { type: "offer", sdp } // backend sent raw string
        : sdp;

    console.log("Received offer:", offerDesc);
    setRemoteOffer(offerDesc);
    setCallData({ ...callData, from });
    setIsRinging(true);
    ringtone.current?.play().catch(() => { });
  };

  const handleAnswer = async ({ sdp, from }: any) => {
    if (from === userId) return;
    if (peerRef.current) {
      console.log("Setting remote description with SDP:", sdp);
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
      setCallStarted(true);
    }
  };

  const createPeerConnection = (otherId: number) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {
          document.body.addEventListener(
            "click",
            () => remoteAudioRef.current?.play().catch(() => { }),
            { once: true }
          );
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || !event.candidate.candidate) return;
      socket.emit("webrtc-candidate", {
        receiver_id: otherId,
        candidate: event.candidate,
      });
    };
    return pc;
  };

  // Caller: initiate call
  const initiateCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      peerRef.current = createPeerConnection(receiver_id);

      // Add local tracks
      stream.getTracks().forEach((track) => peerRef.current?.addTrack(track, stream));

      // Flush any pending ICE candidates
      pendingCandidates.current.forEach((c) =>
        peerRef.current?.addIceCandidate(new RTCIceCandidate(c))
      );
      pendingCandidates.current = [];

      // Create and send offer immediately
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      // socket.emit("webrtc-offer", { receiver_id, sdp: offer });
      socket.emit("webrtc-offer", { receiver_id, sdp: { type: offer.type, sdp: offer.sdp } });

      // Notify server that call is initiated
      socket.emit("private-initiate-call", { receiver_id, call_type: "audio" });
    } catch (err) {
      console.error("Error initiating call:", err);
    }
  };

  // Receiver: accept call
  const acceptCall = async () => {
    console.log("remote offer", remoteOffer);
    if (!remoteOffer || !remoteOffer.type || !remoteOffer.sdp) {
      console.error("No valid remote offer yet");
      return;
    }

    try {
      socket.emit("private-accept-call", { call_id: callData?.id });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      peerRef.current = createPeerConnection(callData.from);
      // Add local tracks
      stream.getTracks().forEach((track) => peerRef.current?.addTrack(track, stream));
      // Flush pending ICE candidates
      pendingCandidates.current.forEach((c) =>
        peerRef.current?.addIceCandidate(new RTCIceCandidate(c))
      );
      pendingCandidates.current = [];

      // Set remote description (offer from caller)
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(remoteOffer!)
      );

      // Create and send answer
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit("webrtc-answer", { receiver_id: callData.from, sdp: answer });

      setCallStarted(true);
      setIsRinging(false);
      ringtone.current?.pause();
    } catch (err) {
      console.error("Failed to accept call:", err);
    }
  };

  // Handle incoming ICE candidates
  const handleCandidate = ({ candidate, from }: any) => {
    if (from === userId || !candidate || !candidate.candidate) return;
    if (peerRef.current) {
      peerRef.current
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch(console.error);
    } else {
      pendingCandidates.current.push(candidate);
    }
  };
  const endCall = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current = null;

    socket.emit("private-end-call", { call_id: callData?.id });
    setShowCall(false);
    setIsRinging(false);
    ringtone.current?.pause();
  };

  //call ended
  useEffect(() => {
    const handleCallEnded = (payload: any) => {
      // Payload is [{ call_id, ended_by }] from server
      const callEndedData = Array.isArray(payload) ? payload[0] : payload;
      console.log("Call ended event received:", callEndedData);

      // Stop local and remote streams
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerRef.current?.close();
      peerRef.current = null;
      localStreamRef.current = null;

      if (remoteAudioRef.current?.srcObject) {
        (remoteAudioRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
        remoteAudioRef.current.srcObject = null;
      }
      // Stop ringtone if playing
      ringtone.current?.pause();
      ringtone.current!.currentTime = 0;
      // Close call UI
      setShowCall(false);
    };

    socket.on("private-call-ended", handleCallEnded);

    return () => {
      socket.off("private-call-ended", handleCallEnded);
    };
  }, []);

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  useEffect(() => {
    if (isCaller) {
      initiateCall();
    }
  }, []);


  return (
    <div className="relative flex flex-col items-center justify-center h-full p-4">
      {!isCaller && isRinging && !callStarted && (
        <div className="flex flex-col items-center space-y-4 p-4 bg-white rounded-lg shadow-lg">
          {/* <p className="bg-black text-2xl">Hello</p> */}
          <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-lg">
            {callerName?.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-lg font-semibold">
            Incoming audio call from {callerName || "Unknown"}
          </p>
          <div className="flex gap-4">
            <button
              onClick={acceptCall}
              className="p-3 bg-green-500 rounded-full"
            >
              <Phone className="w-6 h-6 text-white" />
            </button>
            <button onClick={endCall} className="p-3 bg-red-500 rounded-full">
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {isCaller && !callStarted && (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg font-semibold">
            Calling to {receiverName || "Unknown"}
          </p>
          <p className="text-md italic">Waiting for participant</p>
          <button onClick={endCall} className="p-3 bg-red-500 rounded-full">
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      {callStarted && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full relative flex items-center justify-center text-black dark:text-white font-semibold text-lg">
              {isCaller ? receiverName?.slice(0, 2) : callerName?.slice(0, 2)}
            </div>
            <p className="text-lg font-semibold rounded-full">
              {isCaller ? receiverName : callerName}
            </p>
            <p className="text-sm text-gray-600">
              {formatDuration(callDuration)}
            </p>
          </div>
          <div className="flex gap-4 mt-20 items-center flex-row">
            <button
              onClick={toggleMute}
              className="p-3 bg-gray-200 rounded-full"
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-red-500" />
              ) : (
                <Mic className="w-6 h-6 text-green-500" />
              )}
            </button>
            <button onClick={endCall} className="p-3 bg-red-500 rounded-full">
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
      <audio ref={ringtone} />
    </div>
  );
}
