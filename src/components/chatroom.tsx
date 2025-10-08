import { useEffect, useRef, useState } from "react";
import {Send,Paperclip,ImageIcon,VideoIcon,Music,CheckCheck,File,Download,X,Pin,Trash,Pen} from "lucide-react";
import type { ChatUserType } from "@/dto/UserTypes";
import { Button } from "./ui/button";
import * as Avatar from "@radix-ui/react-avatar";
import AudioMessage from "./AudioPlayer";
import { socket } from "../socket/socket";
import type { loginResponse } from "../dto/response/LoginResponse";
import { formatMessageDate } from "../hooks/helper";
import { toast } from "sonner";
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger} from "./ui/dropdown-menu";
import {  filterMessages, groupMessagesByDay } from "../utils/helper";
import type { PrivateChatMessage } from "../dto/response/PrivateChatMessage";
import { GetAllMessage } from "../http/api/privateChat/getAllMessage";
import { uploadAttachment } from "../http/api/privateChat/uploadAttachment";

type Attachment = { type: string; file: File; url?: string };

interface ChatRoomProps {
  user: ChatUserType;
  loginUser: loginResponse;
}

export default function ChatRoom({ user, loginUser }: ChatRoomProps) {

  const [messages, setMessages] = useState<PrivateChatMessage[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [previewModal, setPreviewModal] = useState<{type: string;url: string;} | null>(null);
  const [text, setText] = useState("");
  const [attachmentType, setAttachmentType] = useState("image");

  // inputs refs
  const listRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // pagination states
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [messagesLoaded, setMessagesLoaded] = useState<boolean>(false);

  // "new message" indicator if user scrolled up
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const pageRef = useRef<number>(0);

  // reset state when switching chat
  useEffect(() => {
    setMessages([]);
    setPendingAttachments([]);
    setText("");
    setPage(1);
    setTotalPages(1);
    setLoadingMore(false);
    setMessagesLoaded(false);
    setIsAtBottom(true);
    setNewMessageCount(0);
  }, [user.id, loginUser.user.id]);

  // Utility: convert API message to our MessageItem shape
  const transformMessageFromApi = (m: any): PrivateChatMessage => {
    return {
      id: String(m.id),
      sender:
        m.sender && typeof m.sender === "object"
          ? { id: m.sender.id, username: m.sender.username, avatar: m.sender.avatar_url }
          : String(m.sender ?? ""),
      receiver:
        m.receiver && typeof m.receiver === "object"
          ? { id: m.receiver.id, username: m.receiver.username }
          : m.receiver,
      content: m.content ?? "",
      created_at: m.created_at ?? new Date().toISOString(),
      attachment_url: m.attachment_url ?? null,
      is_delivered: m.is_delivered ?? false,
      is_pinned: m.is_pinned ?? false,
      is_group: m.is_group ?? false,
      pagination: m.pagination
    };
  };

  // API to fetch a page 
  const fetchPage = async (pageNumber: number) => {
    const chatroom = await GetAllMessage({
      receiverId: Number(user.id),
      page: pageNumber,
      pageSize,
    });

    const chatMessages: PrivateChatMessage[] = (chatroom.messages || []).map(
      (m: any) => transformMessageFromApi(m)
    );
    console.log(page);
    console.log(totalPages);
    console.log(loadingMore);

    return { chatMessages, totalPage: chatroom.pagination?.totalPages ?? 1 };
  };

  // Socket: join & request initial messages 
  useEffect(() => {
    if (!socket) return;
    socket.emit("join", { userId: loginUser.user.id });
    socket.emit("request-messages", { userId: loginUser.user.id });

    const handleAllMsgs = (msgs: any[]) => {
      // transform and filter for this conversation
      const transformed = msgs.flat().map((msg) => transformMessageFromApi(msg));
      const filtered = transformed.filter(
        (m) =>
          (String(m.sender?.id ?? m.sender) === String(loginUser.user.id) &&
            String(m.receiver?.id ?? m.receiver) === String(user.id)) ||
          (String(m.sender?.id ?? m.sender) === String(user.id) &&
            String(m.receiver?.id ?? m.receiver) === String(loginUser.user.id))
      );
      setMessages((prev) => filterMessages([...prev, ...filtered]));
    };
    socket.on("get-messages", handleAllMsgs);
    return () => {
      socket.off("get-messages", handleAllMsgs);
    };
  }, [loginUser.user.id, user.id]);

  // Socket: new incoming single message
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      const newMsg = transformMessageFromApi(msg);
      const belongs =
          (String(newMsg.sender?.id ?? newMsg.sender) === String(user.id) &&
          String(newMsg.receiver?.id ?? newMsg.receiver) === String(loginUser.user.id)) ||
          (String(newMsg.sender?.id ?? newMsg.sender) === String(loginUser.user.id) &&
          String(newMsg.receiver?.id ?? newMsg.receiver) === String(user.id));
        if (!belongs) return;
      setMessages((prev) => {
        const next = filterMessages([...prev, newMsg]);
        return next;
      });

      // if user scrolled up (not at bottom) show new message indicator
      if (!isAtBottom) {
        setNewMessageCount((c) => c + 1);
      } else {
        // scroll to bottom if user is at bottom
        setTimeout(() => {
          if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
        }, 50);
      }
    };

    socket.on("receive-message", handleNewMessage);
    return () => {
      socket.off("receive-message", handleNewMessage);
    };
  }, [isAtBottom, loginUser.user.id, user.id]);

  // Load latest messages initially
  useEffect(() => {
    if (!user.id) return;

    let cancelled = false;

    const loadLatestPage = async () => {
      try {
        // First, fetch page 1 to get totalPage
        const firstPage = await fetchPage(1);
        const totalPage = firstPage.totalPage;
        setTotalPages(totalPage);

        if (totalPage < 1) return;

        // Fetch only the newest page initially
        const { chatMessages } = await fetchPage(totalPage);
        if (cancelled) return;

        // Append messages (oldest → newest)
        const filtered = filterMessages([...chatMessages]);
        setMessages(filtered);

        scrollToBottom();
        setPage(totalPage);
        pageRef.current = totalPage;
        setMessagesLoaded(true);
      } catch (err) {
        console.error("Failed to load latest messages:", err);
      }
    };

    loadLatestPage();

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  // Infinite scroll: load older messages on scroll-to-top
  useEffect(() => {
    if (!messagesLoaded) return;

    let mounted = true;
    let isFetching = false; // prevent duplicate fetches

    const handleScroll = async () => {
      if (!listRef.current || !mounted || isFetching) return;
      const el = listRef.current;
      const { scrollTop, scrollHeight, clientHeight } = el;

      // Detect if at bottom
      const atBottom = scrollHeight - (scrollTop + clientHeight) < 50;
      setIsAtBottom(atBottom);
      if (atBottom) setNewMessageCount(0);

      // Load older messages if near top
      if (scrollTop < 50 && pageRef.current > 1) {
        isFetching = true;
        const nextPage = pageRef.current - 1;

        try {
          const { chatMessages } = await fetchPage(nextPage);
          if (!mounted) return;

          const prevScrollHeight = el.scrollHeight;
          setMessages((prev) => filterMessages([...chatMessages, ...prev]));

          pageRef.current = nextPage;
          setPage(nextPage);

          // Preserve scroll position
          setTimeout(() => {
            if (listRef.current) {
              listRef.current.scrollTop =
                listRef.current.scrollHeight - prevScrollHeight;
            }
          }, 50);
        } catch (err) {
          console.error("Failed to load older messages:", err);
        } finally {
          isFetching = false;
        }
      }
    };

    // Debounce scroll to avoid too many rapid calls
    const debouncedScroll = () => {
      if (handleScrollTimeout.current) clearTimeout(handleScrollTimeout.current);
      handleScrollTimeout.current = setTimeout(handleScroll, 100);
    };

    const handleScrollTimeout = { current: null as NodeJS.Timeout | null };
    const node = listRef.current;
    node?.addEventListener("scroll", debouncedScroll);

    return () => {
      mounted = false;
      node?.removeEventListener("scroll", debouncedScroll);
    };
  }, [messagesLoaded]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  // Send message (including attachments upload)
  const sendMessage = async () => {
    const trimmedText = text.trim();
    if (!trimmedText && pendingAttachments.length === 0) return;

    let uploadedUrl: string | null = null;
    if (pendingAttachments.length > 0) {
      try {
        const result = await uploadAttachment(
          pendingAttachments[0].file,
          pendingAttachments[0].type,
          user?.id
        );
        uploadedUrl = result.url;
        setAttachmentType(result.type ?? attachmentType);
      } catch (error) {
        console.error("Upload failed:", error);
        toast?.error?.("Attachment upload failed");
        return;
      }
    }

    const newMsg: PrivateChatMessage = {
      id: Date.now().toString(),
      sender: String(loginUser.user.id),
      receiver: String(user.id),
      content: trimmedText,
      created_at: new Date().toISOString(),
      attachment_url: uploadedUrl,
      is_delivered: false,
    };

    setMessages((prev) => [...prev, newMsg]);
    setText("");
    setPendingAttachments([]);
    scrollToBottom();

    // emit via socket (matching original payload)
    socket.emit("send-message", {
      sender_id: newMsg.sender,
      receiver_id: newMsg.receiver,
      content: newMsg.content,
      attachment_url: newMsg.attachment_url,
    });
  };

  // Attachment handlers
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
      url: URL.createObjectURL(file),
    }));

    setPendingAttachments((prev) => [...prev, ...newAttachments]);
    setShowAttachmentMenu(false);
  };

  // Quick download helper (used for preview modal)
  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = url.split("/").pop() || "file";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const groupedMessages = groupMessagesByDay(messages);
  const sortedDays = Object.keys(groupedMessages).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // helpers to detect file types safely
  const filePathFromUrl = (url?: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  };

  // Edit message (if you want to keep editing like group chat)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setText(currentText);
  };

  const saveEditedMessage = async () => {
    if (!editingMessageId) return;
    socket.emit("edit-message", { message_id: editingMessageId, new_content: text.trim() });
    setMessages((prev) =>
      prev.map((m) => (m.id === editingMessageId ? { ...m, content: text.trim() } : m))
    );
    setEditingMessageId(null);
    setText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative">
      {/* Messages area */}
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-6 bg-transparent">


        {Object.keys(groupedMessages).length === 0 && (
          <div className="text-center text-sm text-slate-400 mt-6">
            No messages yet. Say hello 
          </div>
        )}

        {sortedDays.map((day) => (
          <div key={day} className="space-y-3">
            <div className="flex justify-center">
              <span className="px-3 py-1 text-xs rounded-full bg-slate-300/70 dark:bg-slate-600/70">
                {formatMessageDate(groupedMessages[day][0].created_at)}
              </span>
            </div>

            {groupedMessages[day].map((m: PrivateChatMessage) => {
              // m.sender could be string (id) or object with id
              const senderId = typeof m.sender === "string" ? m.sender : String(m.sender?.id ?? "");
              const loginId = String(loginUser.user.id);
              const isOwn = senderId === loginId;

              const filePath = filePathFromUrl(m.attachment_url ?? null);
              return (
                <div
                  key={`${m.id}-${new Date(m.created_at).getTime()}`}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-3`}
                >
                  {!isOwn && (
                    <div
                      className={`relative w-10 h-10 ${
                        user.status === "online" ? "ring-2 ring-green-500" : ""
                      } rounded-full`}
                    >
                      <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                        <Avatar.Image
                          src={(m.sender as any)?.avatar ?? (user && user.avatar_url)}
                          alt={(m.sender as any)?.username ?? user?.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                        <Avatar.Fallback className="w-full h-full rounded-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                          {((m.sender as any)?.username ?? user?.username ?? "U")
                            .slice(0, 2)
                            .toUpperCase()}
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
                          {filePath?.match(/\.(jpeg|jpg|png|gif)$/i) && (
                            <img
                              src={m.attachment_url || ""}
                              alt={m.attachment_url || ""}
                              className="max-w-full max-h-60 rounded-lg cursor-pointer"
                              onClick={() =>
                                m.attachment_url &&
                                setPreviewModal({
                                  type: "image",
                                  url: m.attachment_url,
                                })
                              }
                            />
                          )}

                          {filePath?.match(/\.(mp4|webm)$/i) && (
                            <video
                              src={m.attachment_url}
                              controls
                              className="max-w-full max-h-60 rounded-lg"
                            />
                          )}

                          {filePath?.match(/\.(mp3|wav)$/i) && (
                            <AudioMessage file={m.attachment_url} />
                          )}

                          {!filePath?.match(/\.(jpeg|jpg|png|gif|mp4|webm|mp3|wav)$/i) && (
                            <div className="flex items-center gap-2">
                              <a
                                href={m.attachment_url || undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-600"
                              >
                                Open file
                              </a>
                              <button
                                onClick={() => m.attachment_url && handleDownload(m.attachment_url)}
                                className="p-1 rounded text-green-600 hover:text-white hover:bg-green-600"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>{m.content}</div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-1 text-xs text-slate-300">
                      <span>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {/* message actions for own messages */}
                      {isOwn && (
                        <span className="ml-2 flex items-center gap-1">
                          {m.is_delivered && <CheckCheck className="w-3 h-3 text-white" />}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>

                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top">
                              <DropdownMenuItem onClick={() => handleEditMessage(m.id, m.content)}>
                                <Pen className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => alert("Pin not implemented")}>
                                <Pin className="w-4 h-4 mr-2" /> Pin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => alert("Delete not implemented")}>
                                <Trash className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* New message indicator */}
      {!isAtBottom && newMessageCount > 0 && (
        <div
          onClick={() => {
            scrollToBottom();
            setNewMessageCount(0);
          }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full cursor-pointer shadow-lg z-50"
        >
          {newMessageCount} New Message{newMessageCount > 1 ? "s" : ""}
        </div>
      )}

      {/* Pending attachments preview */}
      {pendingAttachments.length > 0 && (
        <div className="p-2 flex gap-3 overflow-x-auto border-t border-b bg-slate-100 dark:bg-slate-800">
          {pendingAttachments.map((att, i) => (
            <div
              key={i}
              className="relative rounded-lg border dark:border-slate-600 p-2 flex flex-col items-center justify-center"
            >
              {att.type === "image" && (
                <img
                  src={att.url ?? URL.createObjectURL(att.file)}
                  alt={att.file.name}
                  className="max-w-[120px] max-h-[80px] rounded cursor-pointer"
                  onClick={() =>
                    setPreviewModal({ type: "image", url: att.url ?? URL.createObjectURL(att.file) })
                  }
                />
              )}
              {att.type === "video" && (
                <video
                  src={att.url ?? URL.createObjectURL(att.file)}
                  className="max-w-[120px] max-h-[80px] rounded cursor-pointer"
                  onClick={() =>
                    setPreviewModal({ type: "video", url: att.url ?? URL.createObjectURL(att.file) })
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
                  href={att.url ?? URL.createObjectURL(att.file)}
                  download={att.file.name}
                  className="p-1 rounded text-green-600 hover:text-white hover:bg-green-600"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() =>
                    setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))
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

      {/* Input & attachments */}
      <div className="p-4 border-t flex gap-2 flex-shrink-0 items-center">
        <div className="relative">
          <button
            onClick={() => setShowAttachmentMenu((prev) => !prev)}
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="attachments"
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
          placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
          className="flex-1 rounded-2xl resize-none p-2 min-h-[44px] max-h-40 bg-white/90 dark:bg-slate-800/60 border focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (editingMessageId) saveEditedMessage();
              else sendMessage();
            }
          }}
        />

        {editingMessageId && (
          <button
            onClick={() => {
              setEditingMessageId(null);
              setText("");
            }}
            className="px-3 py-1 rounded bg-gray-300 text-gray-800 mr-2"
          >
            Cancel
          </button>
        )}

        <Button
          onClick={() => {
            if (editingMessageId) saveEditedMessage();
            else sendMessage();
          }}
          className="px-4 py-2 rounded-full bg-primary text-white"
        >
          <Send /> Send
        </Button>
      </div>

      {/* Fullscreen preview modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-[90%] max-h-[90%] flex flex-col items-center justify-center">
            <button
              onClick={() => setPreviewModal(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
            >
              <X className="w-6 h-6" />
            </button>

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

            <Button className="w-full" onClick={() => handleDownload(previewModal.url)}>
              Download
            </Button>
          </div>
        </div>
      )}
      
    </div>
  );
}
