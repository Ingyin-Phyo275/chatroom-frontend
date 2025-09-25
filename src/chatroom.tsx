import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "./components/ui/button";
import { socket } from "./socket/socket"; // adjust path
import type { ChatUserType } from "@/dto/UserTypes";
import type { loginResponse } from "./dto/response/LoginResponse";

type Message = {
  id: string;
  user: string;
  text: string;
  ts: string;
  senderId?: number;
  receiverId?: number;
};

interface ChatRoomProps {
  user: ChatUserType; // the receiver
  loginUser: loginResponse; // the sender (current logged-in user)
}

export default function ChatRoom({ user, loginUser }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const username = "You";

  // --- Join socket with current userId on mount ---
  useEffect(() => {
    if (!socket || !loginUser?.user?.id) return;
    socket.emit("join", { userId: loginUser.user.id });
    console.log("[SOCKET] Joined with userId:", loginUser.user.id);
  }, []);

  // --- Listen for incoming messages ---
  useEffect(() => {
    const handleIncomingMessage = (msg: Message) => {
      console.log("%c[SOCKET] Incoming message:", "color: green;", msg);
      if (!msg.id) msg.id = Date.now().toString();
      setMessages(prev => [...prev, msg]);
    };

    socket.on("get-messages", handleIncomingMessage);
    console.log("%c[SOCKET] Listening for get-messages", "color: blue;");

    return () => {
      socket.off("get-messages", handleIncomingMessage);
      console.log("%c[SOCKET] Removed listener for get-messages", "color: red;");
    };
  }, []);

  // --- Send message function ---
  const sendMessage = () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      user: username,
      text: trimmedText,
      ts: new Date().toISOString(),
      senderId: Number(  loginUser.user.id),
      receiverId: Number( user.id),
    };

    // Update local state
    setMessages(prev => [...prev, newMsg]);
    setText("");

    console.log("socket payload", { senderId: loginUser.user.id, receiverId: user.id, content: trimmedText });
    // Emit to backend
    socket.emit("send-message", {
      senderId: loginUser.user.id,
      receiverId: user.id,
      content: trimmedText,
    });
    console.log("%c[SOCKET] Emitted send-message to server", "color: orange;");
  };

  // --- Scroll to bottom when messages update ---
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Messages list */}
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.user === username ? "justify-end" : "justify-start"} gap-3`}>
            <div className={`max-w-[70%] p-2 rounded-lg ${m.user === username ? "bg-primary text-white" : "bg-slate-200 text-slate-900"}`}>
              {m.text}
              <div className="flex justify-end mt-1 text-xs text-slate-300">
                <span>{new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2 flex-shrink-0 items-center">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-2xl resize-none p-2 min-h-[44px] max-h-40 border focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button onClick={sendMessage} className="px-4 py-2 rounded-full bg-primary text-white">
          <Send /> Send
        </Button>
      </div>
    </div>
  );
}
