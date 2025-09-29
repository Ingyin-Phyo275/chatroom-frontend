// store/callStore.ts
import { create } from "zustand";

interface CallState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  inCall: boolean;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setInCall: (status: boolean) => void;
}

export const useCallStore = create<CallState>((set) => ({
  localStream: null,
  remoteStream: null,
  inCall: false,
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setInCall: (status) => set({ inCall: status }),
}));
