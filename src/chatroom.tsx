import { useEffect, useRef, useState } from "react";
import { socket } from "@/socket/socket";
import { filterMessages } from "@/utils/helper";
import type { PrivateChatMessage } from "@/dto/response/PrivateChatMessage";
import { uploadAttachment } from "@/http/api/uploadAttachment";
import { toast } from "sonner";
import { GetAllMessage } from "@/http/api/getAllMessage";
import MessageList from "./components/privateChatroom/MessageList";
import AttachmentPreview from "./components/privateChatroom/AttachmentPreview";
import ChatInput from "./components/privateChatroom/ChatInput";
import PreviewModal from "./components/privateChatroom/PreviewModal";

interface PreviewModal {
  preview: {
    type: "image" | "video" | "audio" | "file";
  url: string;
  name?: string;
  }
}
export default function ChatRoom({ user, loginUser }: { user: any; loginUser: any }) {
  const [messages, setMessages] = useState<PrivateChatMessage[]>([]);
  const [text, setText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const [previewModal, setPreviewModal] = useState<PreviewModal | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  console.log(page);

  // 🔹 Transform API message to local format
  const transformMessageFromApi = (m: any): PrivateChatMessage => ({
    id: String(m.id),
    sender:
      m.sender && typeof m.sender === "object"
        ? { id: m.sender.id, username: m.sender.username ?? "Unknown", avatar: m.sender.avatar_url ?? "" }
        : { id: String(m.sender ?? ""), username: "Unknown", avatar: "" },
    receiver:
      m.receiver && typeof m.receiver === "object"
        ? { id: m.receiver.id, username: m.receiver.username ?? "Unknown" }
        : { id: String(m.receiver ?? ""), username: "Unknown" },
    content: m.content ?? "",
    created_at: m.created_at ?? new Date().toISOString(),
    attachment_url: m.attachment_url ?? null,
    is_delivered: m.is_delivered ?? false,
    is_pinned: m.is_pinned ?? false,
    is_group: m.is_group ?? false,
    pagination: m.pagination,
  });

  // 🔹 Scroll to bottom helper
  const scrollToBottom = (smooth = false) => {
    if (chatContainerRef.current) {
      if (smooth) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
      setIsAtBottom(true);
      setNewMessageCount(0);
    }
  };

  // 🔹 Fetch messages (supports infinite scroll)
  const fetchMessages = async (pageToFetch: number) => {
    try {
      const res = await GetAllMessage({ receiverId: Number(user.id), page: pageToFetch, pageSize });
      const newMsgs: PrivateChatMessage[] = (res.messages || []).map(transformMessageFromApi);

      setMessages((prev) => {
        if (pageToFetch === 1) return filterMessages(newMsgs); // first page
        return filterMessages([...newMsgs, ...prev]); // prepend older messages
      });

      const more = newMsgs.length === pageSize;
      setHasMore(more);
    } catch (err) {
      console.error("Fetch messages failed:", err);
    }
  };

  // 🔹 Initial load
  useEffect(() => {
    setMessages([]);
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
    fetchMessages(1).then(() => scrollToBottom());
  }, [user.id]);

  // 🔹 Infinite scroll (load older messages on scroll to top)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    let fetching = false;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Load older messages
      if (scrollTop < 50 && hasMore && !fetching) {
        fetching = true;
        const nextPage = pageRef.current + 1;
        fetchMessages(nextPage).then(() => {
          pageRef.current = nextPage;
          setPage(nextPage);
          fetching = false;
        });
      }

      // Detect bottom
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
      if (atBottom) setNewMessageCount(0);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore]);

  // 🔹 Socket join & message listeners
  useEffect(() => {
    if (!socket) return;
    socket.emit("join", { userId: loginUser.user.id });

    const handleNewMessage = (msg: any) => {
      const newMsg = transformMessageFromApi(msg);
      const belongs =
        (String(newMsg.sender?.id ?? newMsg.sender) === String(user.id) &&
          String(newMsg.receiver?.id ?? newMsg.receiver) === String(loginUser.user.id)) ||
        (String(newMsg.sender?.id ?? newMsg.sender) === String(loginUser.user.id) &&
          String(newMsg.receiver?.id ?? newMsg.receiver) === String(user.id));

      if (!belongs) return;

      setMessages((prev) => filterMessages([...prev, newMsg]));

      // Only increment new message count; scrolling is handled in useEffect below
      if (!isAtBottom) setNewMessageCount((c) => c + 1);
    };

    socket.on("receive-message", handleNewMessage);

    return () => {socket.off("receive-message", handleNewMessage)};
  }, [loginUser.user.id, user.id, isAtBottom]);

  // 🔹 Auto-scroll effect
  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [messages, isAtBottom]);

  // 🔹 Send message
  const sendMessage = async () => {
    const trimmedText = text.trim();
    if (!trimmedText && pendingAttachments.length === 0) return;

    let uploadedUrl: string | null = null;
    if (pendingAttachments.length > 0) {
      try {
        const result = await uploadAttachment(pendingAttachments[0].file, pendingAttachments[0].type);
        uploadedUrl = result.url;
      } catch (err) {
        console.error(err);
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

    socket.emit("send-message", {
      sender_id: newMsg.sender,
      receiver_id: newMsg.receiver,
      content: newMsg.content,
      attachment_url: newMsg.attachment_url,
    });
  };

  const saveEditedMessage = () => {
    setMessages((prev) => prev.map((m) => (m.id === editingMessageId ? { ...m, content: text } : m)));
    setEditingMessageId(null);
    setText("");
  };

  const handleEditMessage = (id: string, content: string) => {
    setEditingMessageId(id);
    setText(content);
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAttachmentClick = (type: string) => {
    setShowAttachmentMenu(false);
    if (type === "image") imageInputRef.current?.click();
    if (type === "video") videoInputRef.current?.click();
    if (type === "audio") audioInputRef.current?.click();
    if (type === "file") fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingAttachments((prev) => [
        ...prev,
        { type, url: URL.createObjectURL(file), name: file.name, file },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative">
      <MessageList
        messages={messages}
        loginUser={loginUser}
        user={user}
        onEdit={handleEditMessage}
        onDownload={handleDownload}
        setPreviewModal={setPreviewModal}
        chatContainerRef={chatContainerRef}
        setIsAtBottom={setIsAtBottom}
      />

      {!isAtBottom && newMessageCount > 0 && (
        <div
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full cursor-pointer shadow-lg z-50"
        >
          {newMessageCount} New Message{newMessageCount > 1 ? "s" : ""}
        </div>
      )}

      <AttachmentPreview
        attachments={pendingAttachments}
        setAttachments={setPendingAttachments}
        setPreviewModal={setPreviewModal}
      />

      <ChatInput
        text={text}
        setText={setText}
        sendMessage={sendMessage}
        editingMessageId={editingMessageId}
        cancelEdit={() => {
          setEditingMessageId(null);
          setText("");
        }}
        saveEditedMessage={saveEditedMessage}
        handleAttachmentClick={handleAttachmentClick}
        handleFileSelect={handleFileSelect}
        inputRefs={{ imageInputRef, videoInputRef, audioInputRef, fileInputRef }}
        showAttachmentMenu={showAttachmentMenu}
        setShowAttachmentMenu={setShowAttachmentMenu}
      />

      {previewModal && (
<PreviewModal
  preview={previewModal?.preview}
  onClose={() => setPreviewModal(null)}
  onDownload={(url: string) => handleDownload(url, "download")}
/>
      )}
    </div>
  );
}
