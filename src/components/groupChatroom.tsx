import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { socket } from "../socket/socket";
import { toast } from "sonner";
import type { loginResponse } from "../dto/response/LoginResponse";
import type { ChatUserType } from "../dto/UserTypes";
import type { GetAllMessage } from "../dto/response/GetAllMessage";
import { dedupeMessages } from "../utils/helper";
import { getChatroomDetails } from "../http/api/groupChat/getChatroomDetails";
import { ChatroomUploadFile } from "../http/api/groupChat/chatroomUploadFile";
import { editGroupChatMessage } from "../http/api/groupChat/editGroupChatMessage";
import GroupMessages from "./groupChatroom/MessageList";
import PendingAttachments from "./groupChatroom/PendingAttachments";
import type { Attachment } from "@/dto/types/Attachments";
import ChatInput from "./groupChatroom/ChatInput";
import useCounterStore from "../store/UnreadCount";
import { set } from "zod";

type Props = { user: ChatUserType; loginUser: loginResponse; key: string };

export default function GroupChatRoom({ user, loginUser }: Props) {
  const [messages, setMessages] = useState<GetAllMessage[]>([]);
  const [text, setText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ type: string; url: string } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const attachmentType = "image";
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const loginId = loginUser.user.id.toString();

  //zustand store
  const { value, setValue } = useCounterStore();

  //reset after selected group change
  useEffect(() => {
    setMessages([]);
    setPendingAttachments([]);
    setEditingMessageId(null);
    setNewMessageCount(0);
    setUnreadCount(0);
  }, [user.id]);

  //  Join chatroom
  useEffect(() => {
    if (!user.id || !loginUser.user.id) return;
    socket.emit("join-room", {
      chatroom_id: user.id,
      user_id: loginUser.user.id,
    });
    
  }, [user.id, loginUser.user.id]);


  // Listen for "message-delivered-confirm" (sender side)
  useEffect(() => {
    const handleMessageDeliveredConfirm = ({ messageId }: { messageId: string | number }) => {
      setMessages(prev =>
        prev.map(msg =>
          Number(msg.id) === Number(messageId) ? { ...msg, is_delivered: true } : msg
        )
      );
    };
    socket.on("message-delivered-confirm", handleMessageDeliveredConfirm);
    return () => { socket.off("message-delivered-confirm", handleMessageDeliveredConfirm); };
  }, []);

  // Listen for message edits
  useEffect(() => {
    const handleMessageEdited = ({ message_id, new_content }: any) => {
      setMessages(prev =>
        prev.map(msg =>
          Number(msg.id) === Number(message_id)
            ? { ...msg, content: new_content, isEdited: true }
            : msg
        )
      );
    };
    socket.on("message-edited", handleMessageEdited);
    return () => { socket.off("message-edited", handleMessageEdited); };
  }, []);


    //  Listen for new messages (receiver side)
  useEffect(() => {
    console.log("enter listen messages")
    const handleNewMessage = (msg: GetAllMessage) => {
      console.log("new message", msg)
      const senderId = msg.sender?.id?.toString();

      // Add all messages from server (including the ones I just sent)
      setMessages(prev => dedupeMessages([...prev, msg]));
      (msg?.unreadCount!).map((m: any) => {
        if (m?.userId === loginUser?.user?.id) {
          setValue(user?.id, m?.unreadCount, "Group");
          setUnreadCount(m?.unreadCount);
          // console.log("value form socket",value)
          console.log("unreadcount in group chat", value)
        }
      })

      // If message is from other, send back to  server delivered socket

      if (senderId !== loginId) {
        socket.emit("message-delivered", { messageId: msg.id, receiverId: loginId });
        setNewMessageCount(prev => (isAtBottom ? 0 : prev + 1));
      }
    };
    socket.on("receive-message", handleNewMessage);
    socket.on("message-sent", handleNewMessage);
    return () => {
      socket.off("receive-message", handleNewMessage);
      socket.off("message-sent", handleNewMessage);
    };
  }, [isAtBottom, loginId]);


  // Listen for "message-read" event (someone read the message)
useEffect(() => {
  const handleMessageRead = (payload: { messageId: number; receiverId: number; isRead: boolean; unreadCount: number }) => {
    console.log("Incoming event: message-read", payload);

    // Update the message state to mark as read
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        Number(msg.id) === Number(payload.messageId)
          ? { ...msg, isRead: true }
          : msg
      )
    );

    // Set the new unread count from the payload
    setUnreadCount(payload.unreadCount);

    // Update Zustand store too
    setValue(user.id, payload.unreadCount, "Group");
  };

  socket.on("message-read", handleMessageRead);

  return () => {
    socket.off("message-read", handleMessageRead);
  };
}, [user.id, setValue]);


  //  Fetch messages (pagination)
  const fetchPage = async (pageNumber: number) => {
    const chatroom = await getChatroomDetails({
      chatroomId: Number(user.id),
      page: pageNumber,
      pageSize,
    });

    const chatMessages: GetAllMessage[] = chatroom.messages.map((m: any) => ({
      id: m.id,
      sender: { id: m.sender?.id, username: m.sender?.username },
      chatroom: m.receiver && { id: m.receiver.id, username: m.receiver.username },
      content: m.content ?? "",
      created_at: m.created_at ?? new Date().toISOString(),
      attachment_url: Array.isArray(m.attachment_url)
        ? m.attachment_url
        : m.attachment_url
          ? [m.attachment_url]
          : [],
      is_delivered: m.is_delivered ?? false,
      is_pinned: m.is_pinned ?? false,
      is_edit: m.is_edit,
      is_group: true,
      isRead: m.isRead,
    }));

    return { chatMessages, totalPage: chatroom.totalPage ?? 1 };
  };

  //  Load latest messages
  useEffect(() => {
    const loadLatestMessages = async () => {
      if (!user.id) return;
      try {
        const firstPage = await fetchPage(1);
        const totalPage = firstPage.totalPage;
        setTotalPages(totalPage);
        let currentPage = totalPage;
        let allMessages: GetAllMessage[] = [];
        let scrollable = false;

        while (!scrollable && currentPage > 0) {
          const { chatMessages } = await fetchPage(currentPage);
          allMessages = [...chatMessages, ...allMessages];
          setMessages(dedupeMessages([...allMessages]));
          await new Promise(r => setTimeout(r, 50));

          if (listRef.current && listRef.current.scrollHeight > listRef.current.clientHeight) {
            scrollable = true;
          } else {
            currentPage--;
          }
        }
        scrollToBottom();
        setPage(currentPage);
        setMessagesLoaded(true);
      } catch (err) {
        console.error("Failed to load latest messages:", err);
      }
    };
    loadLatestMessages();
  }, [user.id]);

  //  Scroll listener (read receipts + pagination)
  useEffect(() => {
    if (!messagesLoaded) return;
    const readMessagesRef = new Set<string>();

    const handleScroll = async () => {
      if (!listRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      const atBottom = scrollHeight - (scrollTop + clientHeight) < 50;
      setIsAtBottom(atBottom);
      if (atBottom) setNewMessageCount(0);

      // mark visible messages as read (receiver only)
      requestAnimationFrame(() => {
        const messageElements = Array.from(listRef.current!.querySelectorAll<HTMLDivElement>(".message-item"));
        messageElements.forEach(el => {
          const msgId = el.dataset.id;
          const senderId = el.dataset.senderId;
          // console.log("sender id", senderId);
          // console.log("login id", loginId)
          if (!msgId || readMessagesRef.has(msgId) || senderId === loginId) return;
          socket.emit("message-read", { messageId: Number(msgId), readerId: loginId });
          readMessagesRef.add(msgId);
        });
      });

      // load older messages if near top
      if (scrollTop < 50 && !loadingMore && page > 1) {
        setLoadingMore(true);
        const nextPage = page - 1;
        try {
          const { chatMessages } = await fetchPage(nextPage);
          const currentScrollHeight = listRef.current.scrollHeight;
          setMessages(prev => dedupeMessages([...chatMessages, ...prev]));
          setPage(nextPage);
          setTimeout(() => {
            if (listRef.current)
              listRef.current.scrollTop = listRef.current.scrollHeight - currentScrollHeight;
          }, 50);
        } catch (err) {
          console.error("Failed to load older messages:", err);
        } finally {
          setLoadingMore(false);
        }
      }
    };

    const currentList = listRef.current;
    if (currentList) currentList.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => currentList?.removeEventListener("scroll", handleScroll);
  }, [messagesLoaded, page, loadingMore, loginId]);

  const scrollToBottom = () => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  };

  // Send message
  const sendMessage = async () => {
    if (!text.trim() && pendingAttachments.length === 0) return;

    // edit mode
    if (editingMessageId) {
      setMessages(prev =>
        dedupeMessages(
          prev.map(m =>
            m.id === editingMessageId ? { ...m, content: text.trim() } : m
          )
        )
      );
      socket.emit("edit-message", {
        message_id: editingMessageId,
        new_content: text.trim(),
      });
      setEditingMessageId(null);
      setText("");
      return;
    }

    let uploadedAttachments: { attachment_url?: string; imagePath?: string; attachment_type?: string }[] = [];
    if (pendingAttachments.length > 0) {
      try {
        const uploadResults = await Promise.all(
          pendingAttachments.map(att => ChatroomUploadFile(att.file, user?.id, text.trim()))
        );

        uploadedAttachments = uploadResults.map(result => {
          const uploadedUrl = result?.data?.attachment_url?.[0] ?? null;
          const imagePath = result?.data?.imagePath?.[0] ?? null;
          const attachmentTypeToSend = result?.data?.[0]?.attachment_type ?? attachmentType;
          return { attachment_url: uploadedUrl, imagePath, attachment_type: attachmentTypeToSend };
        });
      } catch (error) {
        console.error("Attachment upload failed:", error);
        toast.error("Attachment upload failed");
        return;
      }
    }

    const newMsg: GetAllMessage = {
      id: Date.now().toString(),
      sender: { id: loginUser.user.id, username: loginUser.user.name },
      chatroom: { id: user.id, username: user.username },
      content: text.trim(),
      created_at: new Date().toISOString(),
      attachment_url: uploadedAttachments.map(a => a.attachment_url!).filter(Boolean),
      is_delivered: false,
      is_pinned: false,
      is_group: true,
      is_edit: false,
      isRead: false,
    };

    //setMessages(prev => dedupeMessages([...prev, newMsg]));
    scrollToBottom();
    setText("");
    setPendingAttachments([]);

    socket.emit("chat-message", {
      sender_id: newMsg?.sender?.id,
      chatroom_id: newMsg?.chatroom?.id,
      content: newMsg.content,
      attachment_urls: uploadedAttachments.map(a => a.attachment_url).filter(Boolean),
      imagePath: uploadedAttachments.map(a => a.imagePath).filter(Boolean),
      attachment_types: uploadedAttachments.map(a => a.attachment_type).filter(Boolean),
      is_group: true,
    });
  };

  //  Attachments
  const handleAttachmentClick = (type: string) => {
    switch (type) {
      case "image": imageInputRef.current?.click(); break;
      case "video": videoInputRef.current?.click(); break;
      case "audio": audioInputRef.current?.click(); break;
      case "file": fileInputRef.current?.click(); break;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files) return;

    const attachments: Attachment[] = Array.from(files).map(f => ({
      type: type as "image" | "video" | "audio" | "file",
      file: f,
      url: URL.createObjectURL(f),
    }));

    setPendingAttachments(prev => [...prev, ...attachments]);
    setShowAttachmentMenu(false);
    e.target.value = "";
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setText(currentText);
  };

  const saveEditedMessage = async () => {
    if (!editingMessageId) return;
    const messageIdNumber = Number(editingMessageId);

    try {
      const result = await editGroupChatMessage({
        chatroomId: Number(user.id),
        messageId: messageIdNumber,
        message: text.trim(),
      });
      toast.success(result?.message || "Message updated");

      setMessages(prev =>
        prev.map(msg =>
          Number(msg.id) === messageIdNumber
            ? { ...msg, content: text.trim(), isEdited: true }
            : msg
        )
      );

      socket.emit("edit-message", {
        message_id: messageIdNumber,
        new_content: text.trim(),
        chatroom_id: Number(user.id),
        editor_id: Number(loginUser.user.id),
      });

      setEditingMessageId(null);
      setText("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to edit message");
    }
  };

  useEffect(() => {
    if (isAtBottom && listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isAtBottom]);

  const groupedMessages = messages.reduce<Record<string, GetAllMessage[]>>((groups, msg) => {
    if (!msg.created_at) return groups;
    const dayKey = new Date(msg.created_at).toDateString();
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(msg);
    return groups;
  }, {});

    const handlePinMessage = async (messageId: number) => {
    try {
      socket.emit("group-message-pin", {
        messageId,
        isPinned: true,
        receiverId: Number(user.id),
      })
    } catch (error) {
      console.error("Error pinning message:", error);
      toast.error("Failed to pin message");
    }
  }


    useEffect(() => {
    socket.on("group-message-deleted", ({ messageId }) => {
      console.log("Message deleted event received:", messageId);
      setMessages((prev) => {
        const updated = prev.filter(
          (msg) => String(msg.id) !== String(messageId)
        );
        console.log("Updated messages after delete:", updated);
        return updated;
      });
    });

    return () => {
      socket.off("group-message-deleted");
    };
  }, []);

    const handleDeleteMessage = async (messageId: number) => {
    try {
      //await deleteMessage(messageId, (Number(user.id))); // delete in DB
      socket.emit("group-delete-message", {
        messageId: messageId,
        deleterId: loginUser?.user?.id,
        chatroomId: Number(user.id),
      });
    } catch (err) {
      console.error("Failed to delete message:", err);
      toast?.error?.("Failed to delete message");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative">
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3 bg-white">
        <GroupMessages
          groupedMessages={groupedMessages}
          loginUser={loginUser}
          onEditMessage={handleEditMessage}
          onPin={handlePinMessage}
          onDelete={handleDeleteMessage}
        />
      </div>

      {!isAtBottom && newMessageCount > 0 && (
        <div
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full cursor-pointer shadow-lg z-50"
        >
          {newMessageCount} New Message{newMessageCount > 1 ? "s" : ""}
        </div>
      )}

      <PendingAttachments
        pendingAttachments={pendingAttachments}
        setPendingAttachments={setPendingAttachments}
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <button
            onClick={() => setPreviewModal(null)}
            className="absolute top-4 right-4 p-2 rounded-full text-white"
          >
            <X className="w-6 h-6" />
          </button>
          {previewModal.type === "image" && (
            <img src={previewModal.url} alt="preview" className="max-w-[90%] max-h-[90%] rounded-lg" />
          )}
          {previewModal.type === "video" && (
            <video src={previewModal.url} controls autoPlay className="max-w-[90%] max-h-[90%] rounded-lg" />
          )}
        </div>
      )}
    </div>
  );
}
