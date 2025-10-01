import { useEffect, useRef, useState } from "react";
import {
  Send,
  Paperclip,
  ImageIcon,
  VideoIcon,
  Music,
  CheckCheck,
  File,
  Download,
  X,
} from "lucide-react";
import type { ChatUserType } from "@/dto/UserTypes";
import { Button } from "./ui/button";
import * as Avatar from "@radix-ui/react-avatar";
import AudioMessage from "./AudioPlayer";
import { socket } from "../socket/socket";
import type { loginResponse } from "../dto/response/LoginResponse";
import { formatMessageDate } from "../hooks/helper";
import { uploadAttachment } from "../http/api/uploadAttachment";

type Attachment = { type: string; file: File; url?: string };

type Message = {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  created_at: string;
  is_delivered?: boolean;
  is_pinned?: boolean;
  attachment_url?: string | null;
};

interface ChatRoomProps {
  user: ChatUserType;
  loginUser: loginResponse;
}

export default function ChatRoom({ user, loginUser }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>(
    []
  );
  const [previewModal, setPreviewModal] = useState<{
    type: string;
    url: string;
  } | null>(null);
  const [text, setText] = useState("");
  const [attachmentType, setAttachmentType] = useState("image");

  const listRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // reset state when switching user
  useEffect(() => {
    setMessages([]);
    setPendingAttachments([]);
    setText("");
  }, [user, loginUser.user.id]);

  useEffect(() => {
    socket.onAny((event, ...args) => {
      console.log("[SOCKET EVENT] in private room", event, args);
    });
  }, []);

  //  Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    socket.emit("join", { userId: loginUser.user.id });
    socket.emit("request-messages", { userId: loginUser.user.id });

    const handleAllMessages = (msgs: any[]) => {
      const transformed = msgs.flat().map((msg) => ({
        id: String(msg.id),
        sender: String(msg.sender?.id),
        receiver: String(msg.receiver?.id),
        content: msg.content || "",
        created_at: msg.created_at || new Date().toISOString(),
        attachment_url: msg.attachment_url || null,
        is_delivered: msg.is_delivered ?? true,
        is_pinned: msg.is_pinned ?? false,
      }));

      const filtered = transformed.filter(
        (m) =>
          (m.sender === String(loginUser.user.id) &&
            m.receiver === String(user.id)) ||
          (m.sender === String(user.id) &&
            m.receiver === String(loginUser.user.id))
      );

      setMessages(filtered);
    };

    socket.on("get-messages", handleAllMessages);

    const handleNewMessage = (msg: any) => {
      const newMsg = {
        id: String(msg.id),
        sender: String(msg.sender?.id),
        receiver: String(msg.receiver?.id),
        content: msg.content || "",
        created_at: msg.created_at || new Date().toISOString(),
        attachment_url: msg.attachment_url || null,
        is_delivered: msg.is_delivered ?? true,
        is_pinned: msg.is_pinned ?? false,
      };

      if (
        (newMsg.sender === String(user.id) &&
          newMsg.receiver === String(loginUser.user.id)) ||
        (newMsg.sender === String(loginUser.user.id) &&
          newMsg.receiver === String(user.id))
      ) {
        setMessages((prev) => [...prev, newMsg]);
      }
    };

    socket.on("receive-message", handleNewMessage);
    return () => {
      socket.off("get-messages", handleAllMessages);
      socket.off("receive-message", handleNewMessage);
    };
  }, [loginUser.user.id, user.id]);

  const sendMessage = async () => {
    const trimmedText = text.trim();
    if (!trimmedText && pendingAttachments.length === 0) return;

    let uploadedUrl: string | null = null;

    if (pendingAttachments.length > 0) {
      console.log(
        "Payload",
        pendingAttachments[0].url,
        pendingAttachments[0].type
      );
      try {
        const result = await uploadAttachment(
          pendingAttachments[0].file,
          pendingAttachments[0].type
        );
        setTimeout(() => {
          setPendingAttachments([]);
        }, 300);
        // console.log("upload result", result.url)
        uploadedUrl = result.url;
        setAttachmentType(result.type!);
        // console.log("attachment type", attachmentType) //image
      } catch (error) {
        console.error("Upload failed:", error);
        return; // optionally block sending if upload fails
      }
    }

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: String(loginUser.user.id),
      receiver: String(user.id),
      content: trimmedText,
      created_at: new Date().toISOString(),
      attachment_url: uploadedUrl,
    };

    setMessages((prev) => [...prev, newMsg]);
    setText("");
    setPendingAttachments([]);

    const payload = {
      sender_id: newMsg.sender,
      receiver_id: newMsg.receiver,
      content: newMsg.content,
      attachment_url: newMsg.attachment_url,
    };

    socket.emit("send-message", payload);
  };

  // --- Scroll to bottom when messages update ---
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      type,
      file,
      url: URL.createObjectURL(file), //
    }));

    setPendingAttachments((prev) => [...prev, ...newAttachments]);
    setShowAttachmentMenu(false);
  };

  const groupedMessages = messages.reduce(
    (groups: Record<string, Message[]>, msg) => {
      const day = new Date(msg.created_at).toDateString();
      if (!groups[day]) groups[day] = [];
      groups[day].push(msg);
      return groups;
    },
    {}
  );

    const handleDownload = async (url : string) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = url.split("/").pop() || "";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-6">
        {Object.keys(groupedMessages).map((day) => (
          <div key={day} className="space-y-3">
            {/* Date Divider */}
            <div className="flex justify-center">
              <span className="px-3 py-1 text-xs rounded-full bg-slate-300/70 dark:bg-slate-600/70">
                {formatMessageDate(groupedMessages[day][0].created_at)}
              </span>
            </div>

            {/* Messages of this day */}
            {groupedMessages[day].map((m) => {
              const filePath = m.attachment_url
                ? new URL(m.attachment_url).pathname
                : null;
              console.log("attachment url", m.attachment_url);
              const isOwn = m.sender === String(loginUser.user.id);
              console.log("attachment type", attachmentType);
              return (
                <div
                  key={m.id}
                  className={`flex ${
                    isOwn ? "justify-end" : "justify-start"
                  } gap-3`}
                >
                  {!isOwn && (
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
                      isOwn
                        ? "bg-primary text-white rounded-br-none"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none"
                    }`}
                  >
                    <div className="mt-1 text-sm space-y-2">
                      {m.attachment_url ? (
                        <div>
                          {filePath!.match(/\.(jpeg|jpg|png|gif)$/i) && (
                            <img
                              src={m.attachment_url || ""}
                              alt={m.attachment_url || ""}
                              className="max-w-full max-h-60 rounded-lg cursor-pointer"
                              onClick={() =>
                                m.attachment_url &&
                                setPreviewModal({
                                  type: "image",
                                  url: m.attachment_url, // guaranteed string now
                                })
                              }
                            />
                          )}
                          {m.attachment_url.match(/\.(mp4|webm)$/i) && (
                            <video
                              src={m.attachment_url}
                              controls
                              className="max-w-full max-h-60 rounded-lg"
                            />
                          )}
                          {m.attachment_url.match(/\.(mp3|wav)$/i) && (
                            <AudioMessage file={m.attachment_url} />
                          )}
                          {!filePath!.match(
                            /\.(jpeg|jpg|png|gif|mp4|webm|mp3|wav)$/i
                          ) && (
                            <>
                              <a
                                href={m.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className=" underline"
                              >
                                Download file
                              </a>
                            </>
                          )}
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-1 text-xs text-slate-300">
                      <span>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isOwn && (
                        <span className="ml-2 flex items-center gap-0.5">
                          {m.is_delivered && (
                            <CheckCheck className="w-3 h-3 text-white" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Pending attachments */}
      {pendingAttachments.length > 0 && (
        <div className="p-2 flex gap-3 overflow-x-auto border-t border-b bg-slate-100 dark:bg-slate-800">
          {pendingAttachments.map((att, i) => (
            <div
              key={i}
              className="relative rounded-lg border dark:border-slate-600 p-2 flex flex-col items-center justify-center"
            >
              {att.type === "image" && (
                <img
                  src={URL.createObjectURL(att.file)}
                  alt={att.file.name}
                  className="max-w-[120px] max-h-[80px] rounded cursor-pointer"
                  onClick={() =>
                    setPreviewModal({
                      type: "image",
                      url: URL.createObjectURL(att.file),
                    })
                  }
                />
              )}
              {att.type === "video" && (
                <video
                  src={URL.createObjectURL(att.file)}
                  className="max-w-[120px] max-h-[80px] rounded cursor-pointer"
                  onClick={() =>
                    setPreviewModal({
                      type: "video",
                      url: URL.createObjectURL(att.file),
                    })
                  }
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
                <a
                  href={URL.createObjectURL(att.file)}
                  download={att.file.name}
                  className="p-1 rounded text-green-600 hover:text-white hover:bg-green-600"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() =>
                    setPendingAttachments((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }
                  className="p-1 rounded text-red-600 hover:text-white hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input + attachment */}
      <div className="p-4 border-t flex gap-2 flex-shrink-0 items-center">
        <div className="relative">
          <button
            onClick={() => setShowAttachmentMenu((prev) => !prev)}
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {showAttachmentMenu && (
            <div className="absolute bottom-full left-0 mb-2 flex flex-col bg-white dark:bg-slate-800 border rounded shadow-lg z-10">
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

        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={imageInputRef}
          onChange={(e) => handleFileSelect(e, "image")}
        />
        <input
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          ref={videoInputRef}
          onChange={(e) => handleFileSelect(e, "video")}
        />
        <input
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          ref={audioInputRef}
          onChange={(e) => handleFileSelect(e, "audio")}
        />
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e, "file")}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-2xl resize-none p-2 min-h-[44px] max-h-40 bg-white/90 dark:bg-slate-800/60 border focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button
          onClick={sendMessage}
          className="px-4 py-2 rounded-full bg-primary text-white"
        >
          <Send /> Send
        </Button>
      </div>

      {/* Fullscreen preview modal */}
      {/* Fullscreen preview modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-[90%] max-h-[90%] flex flex-col items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setPreviewModal(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Content */}
            {previewModal.type === "image" && (
              <img
                src={previewModal.url}
                alt="preview"
                className="max-w-full max-h-[70vh] rounded-lg object-contain mb-4"
              />
            )}

            {previewModal.type === "video" && (
              <video
                src={previewModal.url}
                controls
                autoPlay
                className="max-w-full max-h-[70vh] rounded-lg mb-4"
              />
            )}

            {/* Download button */}
            {/* <a
              href={previewModal.url}
              download
              target="_blank"
              rel="noopener noreferrer"
            > */}
<Button
  className="w-full"
  onClick={() => handleDownload(previewModal.url)}
>
  Download
</Button>
            {/* </a> */}
          </div>
        </div>
      )}
    </div>
  );
}
