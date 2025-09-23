import { io } from "socket.io-client";

export const socket = io("http://192.168.0.96:7000");

// Event: successfully connected
socket.on("connect", () => {
  console.log("✅ Socket connected! Socket ID:", socket.id);
});

socket.onAnyOutgoing((event, ...args) => {
  console.log("Outgoing event:", event, "Payload:", args);
});

// Event: failed connection
socket.on("connect_error", (err) => {
  console.error("❌ Socket connection error:", err.message);
});

// Event: disconnected
socket.on("disconnect", (reason) => {
  console.log("⚠️ Socket disconnected. Reason:", reason);
});
