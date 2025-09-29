// components/AudioCall.tsx
import React, { useEffect, useRef, useState } from "react";
import { useCallStore } from "../store/callStore";
import { createPeerConnection } from "../utils/webrtc";

let pc: RTCPeerConnection;

export const AudioCall: React.FC = () => {
  const {
    localStream,
    remoteStream,
    setLocalStream,
    setRemoteStream,
    setInCall,
    inCall,
  } = useCallStore();

  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const [offerSDP, setOfferSDP] = useState<string>("");
  const [answerSDP, setAnswerSDP] = useState<string>("");

  const checkMicrophone = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasMic = devices.some((d) => d.kind === "audioinput");
    return hasMic;
  };

  const startCall = async () => {
    const hasMic = await checkMicrophone();
    if (!hasMic) {
      alert("No microphone found! Please connect one and allow access.");
      return;
    }

    try {
      pc = createPeerConnection((e) => {
        if (e.streams[0]) {
          setRemoteStream(e.streams[0]);
        }
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      setOfferSDP(JSON.stringify(offer));
      setInCall(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Check permissions or device.");
    }
  };

  const answerCall = async () => {
    const hasMic = await checkMicrophone();
    if (!hasMic) {
      alert("No microphone found! Please connect one and allow access.");
      return;
    }

    try {
      pc = createPeerConnection((e) => {
        if (e.streams[0]) {
          setRemoteStream(e.streams[0]);
        }
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = JSON.parse(offerSDP);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      setAnswerSDP(JSON.stringify(answer));
      setInCall(true);
    } catch (err) {
      console.error("Error answering call:", err);
      alert("Failed to answer call. Check microphone and permissions.");
    }
  };

  const setAnswer = async () => {
    try {
      const answer = JSON.parse(answerSDP);
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error("Error setting answer:", err);
      alert("Failed to set remote SDP. Check the pasted answer.");
    }
  };

  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-lg font-bold">Audio Call Example</h2>

      {!inCall ? (
        <button
          onClick={startCall}
          className="px-4 py-2 mt-2 bg-blue-500 text-white rounded"
        >
          Start Call
        </button>
      ) : (
        <>
          <div className="mt-2">
            <textarea
              className="w-full border p-2"
              value={offerSDP}
              readOnly
              placeholder="Offer SDP"
            />
            <textarea
              className="w-full border p-2 mt-2"
              value={answerSDP}
              onChange={(e) => setAnswerSDP(e.target.value)}
              placeholder="Paste Answer SDP"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={answerCall}
                className="px-3 py-1 bg-green-500 text-white rounded"
              >
                Answer Call
              </button>
              <button
                onClick={setAnswer}
                className="px-3 py-1 bg-purple-500 text-white rounded"
              >
                Set Answer
              </button>
            </div>
          </div>
        </>
      )}

      <div className="mt-4">
        <p className="font-semibold">Local Audio</p>
        <audio ref={localAudioRef} autoPlay muted />
        <p className="font-semibold">Remote Audio</p>
        <audio ref={remoteAudioRef} autoPlay />
      </div>
    </div>
  );
};
