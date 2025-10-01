import { io } from "socket.io-client";

// Read token from localStorage
    const user = JSON.parse(localStorage.getItem('user')!);
    const token = user?.token;console.log("token", token)
export const socket = io("http://localhost:7000", {
  auth: { token }, // send JWT to backend for authentication
});

socket.on("connect", () => {
  
  console.log("Socket connected! Socket ID:", socket.id);
});

socket.onAnyOutgoing((event, ...args) => {
  console.log("Outgoing event:", event, "Payload:", args);
});

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
});

socket.on("disconnect", () => {
  console.log("Socket disconnected:");
});
