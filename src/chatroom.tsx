import { useEffect, useRef, useState } from "react";
import { socket } from "@/socket/socket";
import { filterMessages } from "@/utils/helper";
import type { PrivateChatMessage } from "@/dto/response/PrivateChatMessage";
import { uploadAttachment } from "@/http/api/privateChat/uploadAttachment";
import { toast } from "sonner";
import MessageList from "./components/privateChatroom/MessageList";
import AttachmentPreview from "./components/privateChatroom/AttachmentPreview";
import ChatInput from "./components/privateChatroom/ChatInput";
import PreviewModal from "./components/privateChatroom/PreviewModal";
import { GetAllMessage } from "./http/api/privateChat/getAllMessage";
import { deleteMessage } from "@/http/api/privateChat/deleteMessage";

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

  // Transform API message to local format
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
    attachment_url: m.attachment_url ?? m.attachment_urls ?? null,
    imagePath: m.imagePath ?? m.imagePaths ?? null,
    attachmentType: m.attachmentType ?? m.attachment_type ?? null,
    is_delivered: m.is_delivered ?? false,
    is_pinned: m.is_pinned ?? false,
    is_group: m.is_group ?? false,
    pagination: m.pagination,
  });

  // Scroll helper
  const scrollToBottom = (smooth = false) => {
    if (!chatContainerRef.current) return;
    if (smooth) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
    } else {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    setIsAtBottom(true);
    setNewMessageCount(0);
  };

  // Fetch messages with pagination
  const fetchMessages = async (pageToFetch: number) => {
    try {
      const res = await GetAllMessage({ receiverId: Number(user.id), page: pageToFetch, pageSize });
      const newMsgs: PrivateChatMessage[] = (res.messages || []).map(transformMessageFromApi);

      setMessages((prev) => (pageToFetch === 1 ? filterMessages(newMsgs) : filterMessages([...newMsgs, ...prev])));
      setHasMore(newMsgs.length === pageSize);
    } catch (err) {
      console.error("Fetch messages failed:", err);
    }
  };

  // Initial load
  useEffect(() => {
    setMessages([]);
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
    fetchMessages(1).then(() => scrollToBottom());
  }, [user.id]);

  // Infinite scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    let fetching = false;

    const handleScroll = () => {
      if (container.scrollTop < 50 && hasMore && !fetching) {
        fetching = true;
        const nextPage = pageRef.current + 1;
        fetchMessages(nextPage).then(() => {
          pageRef.current = nextPage;
          setPage(nextPage);
          fetching = false;
        });
      }
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setIsAtBottom(atBottom);
      if (atBottom) setNewMessageCount(0);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore]);

  // Socket join & listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit("join", { userId: loginUser.user.id });

    const handleIncomingMessage = (msg: any) => {
      const newMsg = transformMessageFromApi(msg);
      const belongs =
        (String(newMsg.sender?.id ?? newMsg.sender) === String(user.id) &&
          String(newMsg.receiver?.id ?? newMsg.receiver) === String(loginUser.user.id)) ||
        (String(newMsg.sender?.id ?? newMsg.sender) === String(loginUser.user.id) &&
          String(newMsg.receiver?.id ?? newMsg.receiver) === String(user.id));
      if (!belongs) return;

      setMessages((prev) => filterMessages([...prev, newMsg]));
      if (!isAtBottom) setNewMessageCount((c) => c + 1);
    };

    socket.on("receive-message", handleIncomingMessage); // messages from others
    socket.on("message-sent", handleIncomingMessage);    // messages from self

    return () => {
      socket.off("receive-message", handleIncomingMessage);
      socket.off("message-sent", handleIncomingMessage);
    };
  }, [loginUser.user.id, user.id, isAtBottom]);

  // Auto-scroll when new messages
  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [messages, isAtBottom]);

  // Send message
  const sendMessage = async () => {
    const trimmedText = text.trim();
    if (!trimmedText && pendingAttachments.length === 0) return;

    const uploadedAttachments: { url: string; imagePath?: string | null; type: "image" | "video" | "audio" | "file" }[] = [];

    for (const attachment of pendingAttachments) {
      try {
        const result = await uploadAttachment(attachment.file, attachment.type, user?.id);
        uploadedAttachments.push({
          url: result.url,
          imagePath: result?.imagePath ?? null,
          type: result?.type as "image" | "video" | "audio" | "file",
        });
      } catch (err) {
        console.error(err);
        toast?.error?.(`Failed to upload ${attachment.name}`);
        return;
      }
    }

    const newMsg: PrivateChatMessage = {
      id: Date.now().toString(),
      sender: String(loginUser.user.id),
      receiver: String(user.id),
      content: trimmedText,
      created_at: new Date().toISOString(),
      attachment_urls: uploadedAttachments.length > 0 ? uploadedAttachments.map(a => a.url) : null,
      imagePaths: uploadedAttachments.length > 0 ? uploadedAttachments.map(a => a.imagePath) as string[] : null,
      attachmentTypes: uploadedAttachments.length > 0 ? uploadedAttachments.map(a => a.type) : null,
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
      attachment_urls: newMsg.attachment_urls,
      imagePaths: newMsg.imagePaths,
      attachment_type: newMsg.attachmentTypes,
    });
  };

  // Edit message
  const saveEditedMessage = () => {
    setMessages((prev) => prev.map((m) => (m.id === editingMessageId ? { ...m, content: text } : m)));
    setEditingMessageId(null);
    setText("");
  };

  const handleEditMessage = (id: string, content: string) => {
    setEditingMessageId(id);
    setText(content);
  };

  // Download attachment
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Attachment input handling
  const handleAttachmentClick = (type: string) => {
    setShowAttachmentMenu(false);
    if (type === "image") imageInputRef.current?.click();
    if (type === "video") videoInputRef.current?.click();
    if (type === "audio") audioInputRef.current?.click();
    if (type === "file") fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map((file) => ({
      type,
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));

    setPendingAttachments((prev) => [...prev, ...newAttachments]);
  };

  // Delete message
  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessage(messageId, user?.id);
      await fetchMessages(1);
    } catch (err) {
      console.error("Failed to delete message:", err);
      toast?.error?.("Failed to delete message");
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
        onDelete={handleDeleteMessage}
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
        cancelEdit={() => { setEditingMessageId(null); setText(""); }}
        saveEditedMessage={saveEditedMessage}
        handleAttachmentClick={handleAttachmentClick}
        handleFileSelect={handleFileSelect}
        inputRefs={{ imageInputRef, videoInputRef, audioInputRef, fileInputRef }}
        showAttachmentMenu={showAttachmentMenu}
        setShowAttachmentMenu={setShowAttachmentMenu}
      />

      {previewModal && (
        <PreviewModal
          // @ts-ignore
          preview={previewModal}
          onClose={() => setPreviewModal(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
