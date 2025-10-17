
import { io } from "socket.io-client";

const user = JSON.parse(localStorage.getItem("user")!);
const token = user?.token;
console.log("token", token);

const socketServerURL = import.meta.env.VITE_SOCKET_SERVER_URL;

export const socket = io(socketServerURL, {
  auth: { token },
});

socket.on("connect", () => {
  console.log("Socket connected! Socket ID:", socket.id);
});

socket.onAnyOutgoing((event, ...args) => {
  console.log("Outgoing event:", event, "Payload:", args);
});

socket.onAny((event, ...args) => {
  console.log("Incoming event:", event, "Payload:", args);
});

//  Global incoming group call listener
socket.on("incoming-group-call", (payload) => {
  //console.log("🔥 Global incoming-group-call:", payload);
  const data = Array.isArray(payload) ? payload[0] : payload;
  // Broadcast globally to React app
  window.dispatchEvent(new CustomEvent("incomingGroupCall", { detail: data }));
});

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});
