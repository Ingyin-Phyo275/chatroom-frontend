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
} from "lucide-react";
import type { ChatUserType } from "@/dto/UserTypes";
import { Button } from "./ui/button";
import * as Avatar from "@radix-ui/react-avatar";
import AudioMessage from "./AudioPlayer";

type Message = {
  id: string;
  user: string;
  text: string;
  ts: string;
  delivered?: boolean;
  read?: boolean;
  attachment?: { type: string; file: File };
};

interface ChatRoomProps {
  user: ChatUserType;
}

export default function ChatRoom({ user }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const username = "You";

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  }, [user]);

  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  function 
  sendMessage(attachment?: { type: string; file: File }) {
    if (!text.trim() && !attachment) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      user: username,
      text: text.trim(),
      ts: new Date().toISOString(),
      delivered: true,
      read: false,
      attachment,
    };
    setMessages((prev) => [...prev, newMsg]);
    setText("");
    setShowAttachmentMenu(false);

    // simulate reply
    setTimeout(() => {
      const reply: Message = {
        id: Date.now().toString(),
        user: user.username,
        text: `Reply to: ${newMsg.text || newMsg.attachment?.type}`,
        ts: new Date().toISOString(),
        delivered: true,
        read: true,
      };
      setMessages((prev) => [...prev, reply]);

      // mark last sent message as read
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsg.id ? { ...m, read: true } : m))
      );
    }, 1000);
  }

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

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    if (e.target.files && e.target.files[0]) {
      sendMessage({ type, file: e.target.files[0] });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.user === username ? "justify-end pr-0" : "justify-start"
            } gap-3`}
          >
            {m.user !== username && (
              <div
                className={`relative w-10 h-10 ${
                  user.status === "online" ? "ring-2 ring-green-500" : ""
                } rounded-full`}
              >
                <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                  <Avatar.Image
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                  <Avatar.Fallback className="w-full h-full rounded-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                    {user.username.slice(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
              </div>
            )}
            <div
              className={`max-w-[70%] p-2 rounded-lg relative ${
                m.user === username
                  ? "bg-primary text-white rounded-br-none"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none"
              }`}
            >
              {/* <div className="text-xs font-medium">{m.user}</div> */}
              <div className="mt-1 text-sm">
                {m.attachment ? (
                  <>
                    {m.attachment.type === "image" && (
                      <img
                        src={URL.createObjectURL(m.attachment.file)}
                        alt={m.attachment.file.name}
                        className="max-w-full max-h-60 rounded-lg"
                      />
                    )}
                    {m.attachment.type === "video" && (
                      <video
                        src={URL.createObjectURL(m.attachment.file)}
                        controls
                        className="max-w-full max-h-60 rounded-lg"
                      />
                    )}
                    {m.attachment.type === "audio" && (
                      <AudioMessage file={m.attachment.file} />
                    )}

                    {m.attachment.type === "file" && (
                      <a
                        href={URL.createObjectURL(m.attachment.file)}
                        download={m.attachment.file.name}
                        className="mt-1 p-1 bg-gray-300 dark:bg-slate-600 rounded text-xs inline-block"
                      >
                        <File />
                        {m.attachment.file.name}
                      </a>
                    )}
                  </>
                ) : (
                  m.text
                )}
              </div>

              <div className="flex justify-between items-center mt-1 text-xs text-slate-300">
                <span>
                  {new Date(m.ts).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {m.user === username && (
                  <span className="ml-2 flex items-center gap-0.5">
                    {m.delivered && !m.read && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                    {m.read && <CheckCheck className="w-3 h-3 text-white" />}
                  </span>
                )}
              </div>
            </div>
            {m.user === username && <div></div>}
          </div>
        ))}
      </div>

      {/* Input + attachment */}
      <div className="p-4 border-t dark:border-slate-700 flex gap-2 flex-shrink-0 items-center">
        {/* Attachment icon */}
        <div className="relative">
          <button
            onClick={() => setShowAttachmentMenu((prev) => !prev)}
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {showAttachmentMenu && (
            <div className="absolute bottom-full left-0 mb-2 flex flex-col bg-white dark:bg-slate-800 border dark:border-slate-700 rounded shadow-lg z-10">
              <button
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => handleAttachmentClick("image")}
              >
                <ImageIcon className="w-4 h-4" /> Image
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => handleAttachmentClick("video")}
              >
                <VideoIcon className="w-4 h-4" /> Video
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => handleAttachmentClick("audio")}
              >
                <Music className="w-4 h-4" /> Audio
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => handleAttachmentClick("file")}
              >
                <Send className="w-4 h-4" /> File
              </button>
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={imageInputRef}
          onChange={(e) => handleFileSelect(e, "image")}
        />
        <input
          type="file"
          accept="video/*"
          className="hidden"
          ref={videoInputRef}
          onChange={(e) => handleFileSelect(e, "video")}
        />
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          ref={audioInputRef}
          onChange={(e) => handleFileSelect(e, "audio")}
        />
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e, "file")}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-2xl resize-none  p-2 min-h-[44px] max-h-40 bg-white/90 dark:bg-slate-800/60 border dark:border-slate-700 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button
          onClick={() => sendMessage()}
          className="px-4 py-2 rounded-full bg-primary text-white "
        >
          <Send />
          Send
        </Button>
      </div>
    </div>
  );
}
