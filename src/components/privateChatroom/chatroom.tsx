import { useEffect, useRef, useState } from "react";
import { socket } from "@/socket/socket";
import { filterMessages } from "@/utils/helper";
import type { PrivateChatMessage } from "@/dto/response/PrivateChatMessage";
import { uploadAttachment } from "@/http/api/privateChat/uploadAttachment";
import { toast } from "sonner";
import MessageList from "./MessageList";
import AttachmentPreview from "./AttachmentPreview";
import ChatInput from "./ChatInput";
import PreviewModal from "./PreviewModal";
import { GetAllMessage } from "../../http/api/privateChat/getAllMessage";
import { editPrivateChatMessage } from "../../http/api/privateChat/editPrivateChatMessage";
import useCounterStore from "../../store/UnreadCount";
import type { ChatUserType } from "../../dto/UserTypes";
import type { loginResponse } from "../../dto/response/LoginResponse";
import type { PrivateMessageEdit } from "../../dto/input/PrivateChatMessageEdit";
import type { PrivateIncomingMessage } from "../../dto/response/PrivateIncomingMessage";

interface PreviewModal {
  preview: {
    type: "image" | "video" | "audio" | "file";
    url: string;
    name?: string;
  };
}

export default function ChatRoom({
  user,
  loginUser,
}: {
  user: ChatUserType;
  loginUser: loginResponse;
}) {
  // Refs to store mutable state without re-rendering
  const messagesRef = useRef<PrivateChatMessage[]>([]);

  const messagesCache = useRef<Record<string, PrivateChatMessage[]>>({});

  const pendingAttachmentsRef = useRef<any[]>([]);
  const pageRef = useRef(1);
  const isAtBottomRef = useRef(true);

  // State for things that affect UI directly
  const [text, setText] = useState("");
  const [previewModal, setPreviewModal] = useState<PreviewModal | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [, forceUpdate] = useState({}); // to trigger re-renders when refs change
  const [hasMore, setHasMore] = useState(true);
  const [sendingState, setSendingState] = useState(false);

  // Refs for DOM elements
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setValue } = useCounterStore();
  const pageSize = 10;

  // Reset chat when user changes
  useEffect(() => {
    pendingAttachmentsRef.current = [];
    setEditingMessageId(null);
    setNewMessageCount(0);
    pageRef.current = 1;
    setHasMore(true);

    const cachedMessages = messagesCache.current[user.id];
    if (cachedMessages) {
      messagesRef.current = cachedMessages;
      forceUpdate({});
      scrollToBottom();
    } else {
      fetchMessages(1).then(() => scrollToBottom());
    }
  }, [user.id]);


  // Transform API message to local format
  const transformMessageFromApi = (m: any): PrivateChatMessage => ({
    id: String(m.id),
    sender:
      m.sender && typeof m.sender === "object"
        ? {
          id: m.sender.id,
          username: m.sender.username ?? "Unknown",
          avatar: m.sender.avatar_url ?? "",
        }
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
    is_edit: m.is_edit,
    isRead: m.isRead ?? false,
    pagination: m.pagination,
    duration: m?.call?.duration,
  });

  // Scroll helpers
  const scrollToBottom = (smooth = false) => {
    const container = chatContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });

    isAtBottomRef.current = true;
    setNewMessageCount(0);
  };

  // Fetch messages with pagination
  const fetchMessages = async (pageToFetch: number) => {
    try {
      if (pageToFetch === 1) setLoadingInitial(true);

      const res = await GetAllMessage({
        receiverId: Number(user.id),
        page: pageToFetch,
        pageSize,
      });

      const newMsgs: PrivateChatMessage[] = (res.messages || []).map(
        transformMessageFromApi
      );

      if (pageToFetch === 1) {
        messagesRef.current = filterMessages(newMsgs);
      } else {
        messagesRef.current = filterMessages([
          ...newMsgs,
          ...messagesRef.current,
        ]);
      }

      // store in cache
      messagesCache.current[user.id] = messagesRef.current;
      setHasMore(newMsgs.length === pageSize);
      forceUpdate({});
    } catch (err) {
      console.error("Fetch messages failed:", err);
    } finally {
      setLoadingInitial(false);
    }
  };

  // Handle message edits via socket
  useEffect(() => {
    const handleMessageEdited = ({ message_id, new_content }: PrivateMessageEdit) => {
      messagesRef.current = messagesRef.current.map((msg) =>
        Number(msg.id) === Number(message_id)
          ? { ...msg, content: new_content, is_edit: true }
          : msg
      );
      forceUpdate({});
    };

    socket.on("message-edited", handleMessageEdited);
    return () => {
      socket.off("message-edited", handleMessageEdited);
    };
  }, []);

  // Handle scroll and read messages
  useEffect(() => {
    if (!chatContainerRef.current) return;
    const readMessagesRef = new Set<string>();

    const handleScroll = () => {
      const container = chatContainerRef.current!;
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      isAtBottomRef.current = atBottom;
      if (atBottom) setNewMessageCount(0);

      if (container.scrollTop < 50 && hasMore) {
        const nextPage = pageRef.current + 1;
        fetchMessages(nextPage);
        pageRef.current = nextPage;
      }

      requestAnimationFrame(() => {
        const messageEls = Array.from(
          container.querySelectorAll<HTMLDivElement>(".message-item")
        );
        messageEls.forEach((el) => {
          const msgId = el.dataset.id;
          const senderId = el.dataset.senderId;
          if (!msgId || readMessagesRef.has(msgId)) return;

          if (String(senderId) !== String(loginUser.user.id)) {
            socket.emit("message-read-private", {
              messageId: Number(msgId),
              readerId: Number(loginUser.user.id),
              senderId: Number(user.id),
            });
            setValue(user.id, 0, "Personal");
            readMessagesRef.add(msgId);
          }
        });
      });
    };

    const container = chatContainerRef.current;
    container.addEventListener("scroll", handleScroll);
    handleScroll(); // initial run
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loginUser.user.id, user.id, hasMore]);

  // Socket join & listeners
  useEffect(() => {
    socket.emit("join", { userId: loginUser.user.id });

    const handleIncomingMessage = (msg: PrivateIncomingMessage) => {
      const newMsg = transformMessageFromApi(msg);

      const belongs =
        (String(newMsg.sender?.id ?? newMsg.sender) === String(user.id) &&
          String(newMsg.receiver?.id ?? newMsg.receiver) ===
          String(loginUser.user.id)) ||
        (String(newMsg.sender?.id ?? newMsg.sender) ===
          String(loginUser.user.id) &&
          String(newMsg.receiver?.id ?? newMsg.receiver) === String(user.id));

      if (!belongs) return;

      const existingIndex = messagesRef.current.findIndex(
        (m) =>
          m.sender === String(loginUser.user.id) &&
          m.receiver === String(user.id) &&
          Math.abs(
            new Date(m.created_at).getTime() -
            new Date(newMsg.created_at).getTime()
          ) < 3000
      );

      if (existingIndex !== -1) {
        messagesRef.current[existingIndex] = newMsg;
      } else {
        messagesRef.current.push(newMsg);
      }

      forceUpdate({});

      if (msg?.sender?.id === loginUser?.user?.id) {
        setValue(user?.id, 0, "Personal");
      }

      if (String(msg?.sender?.id) !== String(loginUser.user.id)) {
        setNewMessageCount((prev) => (isAtBottomRef.current ? 0 : prev + 1));
      }
    };

    socket.on("private-receive-message", handleIncomingMessage);
    socket.on("message-sent", handleIncomingMessage);

    return () => {
      socket.off("private-receive-message", handleIncomingMessage);
      socket.off("message-sent", handleIncomingMessage);
    };
  }, [loginUser.user.id, user.id]);

  // Auto-scroll when new messages
  useEffect(() => {
    if (isAtBottomRef.current) scrollToBottom();
  }, [messagesRef.current.length]);

  // Send message
  const sendMessage = async () => {
    const trimmedText = text.trim();
    if (!trimmedText && pendingAttachmentsRef.current.length === 0) return;

    setSendingState(true);
    const uploadedAttachments: {
      url: string;
      imagePath?: string | null;
      type: "image" | "video" | "audio" | "file";
    }[] = [];

    for (const attachment of pendingAttachmentsRef.current) {
      try {
        const result = await uploadAttachment(
          attachment.file,
          attachment.type,
          user?.id
        );
        uploadedAttachments.push({
          url: "",
          imagePath: result?.data?.imagePath ?? null,
          type: result?.type as "image" | "video" | "audio" | "file",
        });
      } catch (err) {
        console.error(err);
        setSendingState(false);
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
      attachment_urls:
        uploadedAttachments.length > 0
          ? uploadedAttachments.map((a) => a.url)
          : null,
      imagePaths:
        uploadedAttachments.length > 0
          ? (uploadedAttachments.map((a) => a.imagePath) as string[])
          : null,
      attachmentTypes:
        uploadedAttachments.length > 0
          ? uploadedAttachments.map((a) => a.type)
          : null,
      is_delivered: false,
      duration: "",
    };

    // messagesRef.current.push(newMsg);
    forceUpdate({});
    setText("");
    pendingAttachmentsRef.current = [];
    scrollToBottom();

    socket.emit("send-message", {
      sender_id: newMsg.sender,
      receiver_id: newMsg.receiver,
      content: newMsg.content,
      attachment_urls: newMsg.attachment_urls,
      imagePaths: newMsg.imagePaths,
      attachment_type: newMsg.attachmentTypes,
    });

    setSendingState(false);
  };

  // Edit message
  const saveEditedMessage = async () => {
    if (!editingMessageId) return;
    try {
      const messageIdNumber = Number(editingMessageId);
      const result = await editPrivateChatMessage({
        msgId: messageIdNumber,
        content: text,
      });
      toast.success(result?.message || "Message updated");

      messagesRef.current = messagesRef.current.map((msg) =>
        msg.id === editingMessageId ? { ...msg, content: text, is_edit: true } : msg
      );
      forceUpdate({});

      socket.emit("edit-message", {
        message_id: messageIdNumber,
        new_content: text.trim(),
        receiver_id: Number(user.id),
        editor_id: Number(loginUser.user.id),
      });

      setEditingMessageId(null);
      setText("");
    } catch (err) {
      console.error("Failed to edit message:", err);
      toast?.error?.("Failed to edit message");
      return;
    }
  };

  const handleEditMessage = (id: string, content: string) => {
    setEditingMessageId(id);
    setText(content);
  };

  // File attachments
  const handleAttachmentClick = (type: string) => {
    setShowAttachmentMenu(false);
    if (type === "image") imageInputRef.current?.click();
    if (type === "video") videoInputRef.current?.click();
    if (type === "audio") audioInputRef.current?.click();
    if (type === "file") fileInputRef.current?.click();
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments = Array.from(files).map((file) => ({
      type,
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));
    pendingAttachmentsRef.current.push(...newAttachments);
    forceUpdate({});
  };


  // Delete & pin & forward message

  const handleDeleteMessage = async (messageId: number, is_everyone: boolean) => {
    try {
      socket.emit("delete-message", {
        message_id: messageId,
        sender_id: loginUser?.user?.id,
        receiver_id: user?.id,
        is_everyone,
      });
    } catch (err) {
      console.error("Failed to delete message:", err);
      toast?.error?.("Failed to delete message");
    }
  };

  const handlePinMessage = async (messageId: number) => {
    try {
      socket.emit("message-pin", {
        messageId,
        isPinned: true,
        receiverId: Number(user.id),
      });
    } catch (error) {
      console.error("Error pinning message:", error);
      toast.error("Failed to pin message");
    }
  };

  const handleForwardMessage = async (messageId: number, receiverIds: number[]) => {
    try {
      socket.emit("forward-message", { messageId, receiverIds })
      console.log("forward data", { messageId }, " - ", { receiverIds })
    } catch (error) {
      toast.error(String(error))
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative">
      <MessageList
        messages={messagesRef.current}
        loginUser={loginUser}
        user={user}
        onEdit={handleEditMessage}
        onDownload={(url, name) => {
          const link = document.createElement("a");
          link.href = url;
          link.download = name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
        setPreviewModal={setPreviewModal}
        chatContainerRef={chatContainerRef}
        setIsAtBottom={(val) => {
          isAtBottomRef.current = val;
        }}
        onDelete={handleDeleteMessage}
        onPin={handlePinMessage}
        onForward={handleForwardMessage}
        loading={loadingInitial} // pass loading state
      />

      {!isAtBottomRef.current && newMessageCount > 0 && (
        <div
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full cursor-pointer shadow-lg z-50"
        >
          {newMessageCount} New Message{newMessageCount > 1 ? "s" : ""}
        </div>
      )}

      <AttachmentPreview
        attachments={pendingAttachmentsRef.current}
        setAttachments={(attachments) => {
          pendingAttachmentsRef.current = attachments;
          forceUpdate({});
        }}
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
        inputRefs={{
          imageInputRef,
          videoInputRef,
          audioInputRef,
          fileInputRef,
        }}
        showAttachmentMenu={showAttachmentMenu}
        setShowAttachmentMenu={setShowAttachmentMenu}
        isSending={sendingState}
      />

      {previewModal && (
        <PreviewModal
          // @ts-ignore
          preview={previewModal}
          onClose={() => setPreviewModal(null)}
          onDownload={(url, name) => {
            const link = document.createElement("a");
            link.href = url;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        />
      )}
    </div>
  );
}
