import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Send,
  Paperclip,
  ImageIcon,
  VideoIcon,
  Music,
  File,
  X,
  Download,
} from "lucide-react";
import type { ChatUserType } from "@/dto/UserTypes";
import { Button } from "./ui/button";
import * as Avatar from "@radix-ui/react-avatar";
import AudioMessage from "./AudioPlayer";
import { socket } from "../socket/socket"; // adjust path as needed
import type { loginResponse } from "../dto/response/LoginResponse";

// --- Hook to persist input/textarea per user ---
function useUserDraft(userId: string, key: string, initialValue = "") {
  const storageKey = `${key}-${userId}`;
  const [value, setValue] = useState<string>(initialValue);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setValue(parsed.value || "");
    } else {
      setValue(initialValue);
    }
  }, [storageKey, initialValue]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ value }));
  }, [storageKey, value]);

  const clear = () => {
    localStorage.removeItem(storageKey);
    setValue("");
  };




  return { value, setValue, clear };
}

type Attachment = { type: string; file: File };

type Message = {
  id: string;
  user: string;
  text: string;
  ts: string;
  delivered?: boolean;
  read?: boolean;
  attachments?: Attachment[];
};

interface ChatRoomProps {
  user: ChatUserType;
  loginUser: loginResponse
}

export default function ChatRoom({ user, loginUser }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [previewModal, setPreviewModal] = useState<{ type: string; url: string } | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const username = "You";

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  // --- Use hook for message input draft ---
  const { value: text, setValue: setText, clear: clearText } = useUserDraft(user.id, "pendingMessage");
  // Initialize messages when user changes
  useEffect(() => {
    setMessages([
      {
        id: "1",
        user: user.username,
        text: `Hi! I am ${user.username}`,
        ts: new Date().toISOString(),
        delivered: true,
        read: true,
      },
      {
        id: "2",
        user: username,
        text: "Hello!",
        ts: new Date().toISOString(),
        delivered: true,
        read: false,
      },
    ]);

    setPendingAttachments([]); // clear attachments
  }, [user]);

  useEffect(() => {

    const handleIncomingMessage = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on("receiveMessage", handleIncomingMessage);

    return () => {
      socket.off("receiveMessage", handleIncomingMessage);
    };
  }, [user.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // --- Sending a message ---
  // function sendMessage() {
  //   if (!text.trim() && !pendingAttachments.length) return;

  //   const newMsg: Message = {
  //     id: Date.now().toString(),
  //     user: username,
  //     text: text.trim(),
  //     ts: new Date().toISOString(),
  //     delivered: true,
  //     read: false,
  //     attachments: pendingAttachments.length ? pendingAttachments : undefined,
  //   };

  //   setMessages((prev) => [...prev, newMsg]);
  //   clearText(); // clear draft
  //   setPendingAttachments([]);
  //   setShowAttachmentMenu(false);

  //   // simulate reply
  //   setTimeout(() => {
  //     const reply: Message = {
  //       id: Date.now().toString(),
  //       user: user.username,
  //       text: `Reply to: ${newMsg.text || newMsg.attachments?.[0]?.type}`,
  //       ts: new Date().toISOString(),
  //       delivered: true,
  //       read: true,
  //     };
  //     setMessages((prev) => [...prev, reply]);
  //     setMessages((prev) =>
  //       prev.map((m) => (m.id === newMsg.id ? { ...m, read: true } : m))
  //     );
  //   }, 1000);
  // }

  const sendMessage = () => {
    if (!text.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      user: "You",
      text: text.trim(),
      ts: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    clearText();


    socket.emit("chat-message", {
      chatroomId: 1,
      userId: loginUser.user.id,
      content: newMsg.text,
    });
  };



  const handleAttachmentClick = (type: string) => {
    switch (type) {
      case "image":
        imageInputRef.current?.click();
        break;
      case "video":
        videoInputRef.current?.click();
        break;
      case "audio":
        audioInputRef.current?.click();
        break;
      case "file":
        fileInputRef.current?.click();
        break;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: Attachment[] = Array.from(e.target.files).map((f) => ({ type, file: f }));
      setPendingAttachments((prev) => [...prev, ...files]);
    }
    setShowAttachmentMenu(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.user === username ? "justify-end pr-0" : "justify-start"} gap-3`}>
            {m.user !== username && (
              <div className={`relative w-10 h-10 ${user.status === "online" ? "ring-2 ring-green-500" : ""} rounded-full`}>
                <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                  <Avatar.Image src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full object-cover" />
                  <Avatar.Fallback className="w-full h-full rounded-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                    {user.username.slice(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
              </div>
            )}
            <div
              className={`max-w-[70%] p-2 rounded-lg relative ${m.user === username
                  ? "bg-primary text-white rounded-br-none"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none"
                }`}
            >
              <div className="mt-1 text-sm space-y-2">
                {m.attachments?.length ? (
                  m.attachments.map((att, i) => (
                    <div key={i} className="relative">
                      {att.type === "image" && (
                        <img
                          src={URL.createObjectURL(att.file)}
                          alt={att.file.name}
                          className="max-w-full max-h-60 rounded-lg cursor-pointer"
                          onClick={() => setPreviewModal({ type: "image", url: URL.createObjectURL(att.file) })}
                        />
                      )}
                      {att.type === "video" && (
                        <video
                          src={URL.createObjectURL(att.file)}
                          controls
                          className="max-w-full max-h-60 rounded-lg cursor-pointer"
                          onClick={() => setPreviewModal({ type: "video", url: URL.createObjectURL(att.file) })}
                        />
                      )}
                      {att.type === "audio" && <AudioMessage file={att.file} />}
                      {att.type === "file" && (
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4" />
                          <span>{att.file.name}</span>
                        </div>
                      )}
                      {m.user === username && (
                        <a
                          href={URL.createObjectURL(att.file)}
                          download={att.file.name}
                          className="mt-1 p-1 rounded bg-green-500 text-white hover:bg-green-600 inline-flex items-center gap-1 text-xs"
                        >
                          <Download className="w-4 h-4" /> Download
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  m.text
                )}
              </div>

              <div className="flex justify-between items-center mt-1 text-xs text-slate-300">
                <span>{new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                {m.user === username && (
                  <span className="ml-2 flex items-center gap-0.5">
                    {m.delivered && !m.read && <Check className="w-3 h-3 text-white" />}
                    {m.read && <CheckCheck className="w-3 h-3 text-white" />}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending attachments */}
      {pendingAttachments.length > 0 && (
        <div className="p-2 flex gap-3 overflow-x-auto border-t border-b dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
          {pendingAttachments.map((att, i) => (
            <div key={i} className="relative rounded-lg border dark:border-slate-600 p-2 flex flex-col items-center justify-center">
              {att.type === "image" && (
                <img
                  src={URL.createObjectURL(att.file)}
                  alt={att.file.name}
                  className="max-w-[120px] max-h-[80px] rounded cursor-pointer"
                  onClick={() => setPreviewModal({ type: "image", url: URL.createObjectURL(att.file) })}
                />
              )}
              {att.type === "video" && (
                <video
                  src={URL.createObjectURL(att.file)}
                  className="max-w-[120px] max-h-[80px] rounded cursor-pointer"
                  onClick={() => setPreviewModal({ type: "video", url: URL.createObjectURL(att.file) })}
                />
              )}
              {att.type === "audio" && <AudioMessage file={att.file} />}
              {att.type === "file" && (
                <div className="flex flex-col items-center text-xs">
                  <File className="w-6 h-6" />
                  {att.file.name}
                </div>
              )}
              <div className="flex gap-2 mt-1">
                <a href={URL.createObjectURL(att.file)} download={att.file.name} className="p-1 rounded text-white hover:bg-green-600">
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                  className="p-1 rounded text-white hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input + attachment */}
      <div className="p-4 border-t dark:border-slate-700 flex gap-2 flex-shrink-0 items-center">
        {/* Attachment icon */}
        <div className="relative">
          <button onClick={() => setShowAttachmentMenu((prev) => !prev)} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
            <Paperclip className="w-5 h-5" />
          </button>

          {showAttachmentMenu && (
            <div className="absolute bottom-full left-0 mb-2 flex flex-col bg-white dark:bg-slate-800 border dark:border-slate-700 rounded shadow-lg z-10">
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleAttachmentClick("image")}>
                <ImageIcon className="w-4 h-4" /> Image
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleAttachmentClick("video")}>
                <VideoIcon className="w-4 h-4" /> Video
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleAttachmentClick("audio")}>
                <Music className="w-4 h-4" /> Audio
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleAttachmentClick("file")}>
                <Send className="w-4 h-4" /> File
              </button>
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input type="file" accept="image/*" multiple className="hidden" ref={imageInputRef} onChange={(e) => handleFileSelect(e, "image")} />
        <input type="file" accept="video/*" multiple className="hidden" ref={videoInputRef} onChange={(e) => handleFileSelect(e, "video")} />
        <input type="file" accept="audio/*" multiple className="hidden" ref={audioInputRef} onChange={(e) => handleFileSelect(e, "audio")} />
        <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => handleFileSelect(e, "file")} />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-2xl resize-none p-2 min-h-[44px] max-h-40 bg-white/90 dark:bg-slate-800/60 border dark:border-slate-700 focus:outline-none"
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

      {/* Fullscreen preview modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <button onClick={() => setPreviewModal(null)} className="absolute top-4 right-4 p-2 rounded-full text-white">
            <X className="w-6 h-6" />
          </button>
          {previewModal.type === "image" && <img src={previewModal.url} alt="preview" className="max-w-[90%] max-h-[90%] rounded-lg" />}
          {previewModal.type === "video" && <video src={previewModal.url} controls autoPlay className="max-w-[90%] max-h-[90%] rounded-lg" />}
        </div>
      )}
    </div>
  );
}
