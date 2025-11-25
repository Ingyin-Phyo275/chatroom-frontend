import { io, Socket } from "socket.io-client";
import useCounterStore from "../store/UnreadCount";

// Your Socket.IO server URL from .env
const socketServerURL = import.meta.env.VITE_SOCKET_SERVER_URL;

// Create the socket instance (don't auto-connect yet)
export const socket: Socket = io(socketServerURL, {
  autoConnect: false,
});

// Try to connect only if token exists in localStorage
function initSocketConnection() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = user?.token;

    if (!token) {
      console.warn("⚠️ Socket not connected: token missing");
      return;
    }

    socket.auth = { token };
    socket.connect();
  } catch (err) {
    console.error("Error initializing socket connection:", err);
  }
}

// Automatically attempt connection after short delay (so localStorage is ready)
setTimeout(initSocketConnection, 300);

// Optional exported function if you need to reconnect manually
export const connectSocket = () => {
  initSocketConnection();
};

// Optional helper to manually disconnect
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log("🔌 Socket disconnected manually");
  }
};

// ====== GLOBAL LISTENERS ======

socket.on("connect", () => {
  console.log("✅ Socket connected! Socket ID:", socket.id);

  socket.on("receive-message", (msg) => {
    console.log("global receive-message", msg);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    let unreadCount = 0;

    console.log("login user id", user?.user?.id)

    msg?.unreadCount?.forEach((unread: any) => {
      if (unread.userId === user?.user?.id) unreadCount = unread.count;
    });

    const { setValue } = useCounterStore.getState();
    setValue(msg?.chatroom_id, unreadCount, "Group");
  });

  // socket.on("private-receive-message", (msg) => {
  //   console.log("global private receive-message", msg);
  //   const user = JSON.parse(localStorage.getItem("user") || "{}");
  //   let unreadCount = msg?.unreadCount;
  //   console.log("private unread count", unreadCount)
  //   const { setValue } = useCounterStore.getState();
  //   setValue(user?.id, unreadCount, "Personal");
  // })
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ Socket disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connection error:", err.message);
});

// socket.onAnyOutgoing((event, ...args) => {
//   console.log("📤 Outgoing event:", event, "Payload:", args);
// });

// socket.onAny((event, ...args) => {
//   console.log("📥 Incoming event:", event, "Payload:", args);
// });

// Global incoming group call listener
socket.on("incoming-group-call", (payload) => {
  const data = Array.isArray(payload) ? payload[0] : payload;
  window.dispatchEvent(new CustomEvent("incomingGroupCall", { detail: data }));
});


