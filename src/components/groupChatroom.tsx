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

// type Attachment = { type: string; file: File; url?: string };
type Props = { user: ChatUserType; loginUser: loginResponse };

export default function GroupChatRoom({ user, loginUser }: Props) {
  const [messages, setMessages] = useState<GetAllMessage[]>([]);
  const [text, setText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>(
    []
  );
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    type: string;
    url: string;
  } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [attachmentType, setattachmentType] = useState("image");

  //api call variables
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);

  //accathments input
  const listRef = useRef<HTMLDivElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Join chatroom
  useEffect(() => {
    if (!user.id || !loginUser.user.id) return;
    socket.emit("join-room", {
      chatroom_id: user.id,
      user_id: loginUser.user.id,
    });
  }, [user.id, loginUser.user.id]);


useEffect(() => {
  const handleNewMessage = (msg: GetAllMessage) => {
    const senderId = msg.sender?.id?.toString();
    const chatroomId = msg.chatroom?.id?.toString();
    const userId = user.id.toString();
    const loginId = loginUser.user.id.toString();

    if (!msg.is_group || (senderId === userId && chatroomId === loginId) || (senderId === loginId && chatroomId === userId)) {
      setMessages((prev) => dedupeMessages([...prev, msg]));

      // Increment new message count **only if user is not at bottom**
      setNewMessageCount((prevCount) => (isAtBottom ? 0 : prevCount + 1));
    }
  };

  socket.on("receive-message", handleNewMessage);
  return () => {socket.off("receive-message", handleNewMessage)};
}, [user.id, loginUser.user.id, isAtBottom]);

  // Fetch a specific page
  const fetchPage = async (pageNumber: number) => {
    const chatroom = await getChatroomDetails({
      chatroomId: Number(user.id),
      page: pageNumber,
      pageSize,
    });
    const chatMessages: GetAllMessage[] = chatroom.messages.map((m: any) => ({
      id: m.id,
      sender: { id: m.sender?.id, username: m.sender?.username },
      chatroom: m.receiver && {
        id: m.receiver.id,
        username: m.receiver.username,
      },
      content: m.content ?? "",
      created_at: m.created_at ?? new Date().toISOString(),
      attachment_url: Array.isArray(m.attachment_url)
        ? m.attachment_url
        : m.attachment_url
        ? [m.attachment_url]
        : [],
      is_delivered: m.is_delivered ?? false,
      is_pinned: m.is_pinned ?? false,
    }));

    return { chatMessages, totalPage: chatroom.totalPage ?? 1 };
  };

  // Load latest messages
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
          //console.log(`Call api second time ${currentPage}`)
          allMessages = [...chatMessages, ...allMessages];
          setMessages(dedupeMessages([...allMessages]));
          await new Promise((r) => setTimeout(r, 50));

          if (
            listRef.current &&
            listRef.current.scrollHeight > listRef.current.clientHeight
          ) {
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

  useEffect(() => {
    if (!messagesLoaded) return; 
    const handleScroll = async () => {
      // console.log("Scroll event");
      if (!listRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      const atBottom = scrollHeight - (scrollTop + clientHeight) < 50;
      setIsAtBottom(atBottom);
      if (atBottom) setNewMessageCount(0);

      if (scrollTop < 50 && !loadingMore && page > 1) {
        setLoadingMore(true);
        const nextPage = page - 1;
        try {
          // console.log(`Call api in scroll ${nextPage}`)
          const { chatMessages } = await fetchPage(nextPage);
          const currentScrollHeight = listRef.current.scrollHeight;
          setMessages((prev) => dedupeMessages([...chatMessages, ...prev]));
          setPage(nextPage);
          setTimeout(() => {
            if (listRef.current)
              listRef.current.scrollTop =
                listRef.current.scrollHeight - currentScrollHeight;
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
    return () => currentList?.removeEventListener("scroll", handleScroll);
  }, [messagesLoaded, page, loadingMore, user.id]);

  const scrollToBottom = () => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  };


  //send message with single socket call for multiple attachments by using array of imagePath
  const sendMessage = async () => {
    if (!text.trim() && pendingAttachments.length === 0) return;

    // Edit mode
    if (editingMessageId) {
      setMessages((prev) =>
        dedupeMessages(
          prev.map((m) =>
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

    let uploadedAttachments: {
      attachment_url?: string;
      imagePath?: string;
      attachment_type?: string;
    }[] = [];

    if (pendingAttachments.length > 0) {
      // Upload all attachments in parallel
      try {
        const uploadResults = await Promise.all(
          pendingAttachments.map((att) =>
            ChatroomUploadFile(att.file, user?.id, text.trim())
          )
        );

        uploadedAttachments = uploadResults.map((result) => {
          const uploadedUrl = result?.data?.attachment_url?.[0] ?? null;
          const imagePath = result?.data?.imagePath?.[0] ?? null;
          const attachmentTypeToSend =
            result?.data?.[0]?.attachment_type ?? attachmentType;
          return {
            attachment_url: uploadedUrl,
            imagePath,
            attachment_type: attachmentTypeToSend,
          };
        });
      } catch (error) {
        console.error("Attachment upload failed:", error);
        toast?.error?.("Attachment upload failed");
        return;
      }
    }

    const newMsg: GetAllMessage = {
      id: Date.now().toString(),
      sender: { id: loginUser.user.id, username: loginUser.user.name },
      chatroom: { id: user.id, username: user.username },
      content: text.trim(),
      created_at: new Date().toISOString(),
      attachment_urls: uploadedAttachments
        .map((a) => a.attachment_url)
        .filter(Boolean) as string[],
      attachment_url: uploadedAttachments
        .map((a) => a.attachment_url)
        .filter(Boolean) as string[], 
      imagePaths: uploadedAttachments.map((a) => a.imagePath).filter(Boolean) as string[],
      attachment_types: uploadedAttachments
        .map((a) => a.attachment_type!)
        .filter(Boolean),
      is_delivered: true,
      is_pinned: false,
      is_group: true,
    };

    setMessages((prev) => dedupeMessages([...prev, newMsg]));
    scrollToBottom();
    socket.emit("chat-message", {
      sender_id: newMsg.sender?.id,
      chatroom_id: newMsg.chatroom?.id,
      content: newMsg.content,
      attachment_urls: uploadedAttachments
        .map((a) => a.attachment_url)
        .filter(Boolean),
      imagePath: uploadedAttachments.map((a) => a.imagePath).filter(Boolean), // send array
      attachment_types: uploadedAttachments
        .map((a) => a.attachment_type)
        .filter(Boolean), // send array
      is_group: true,
    });

    setText("");
    setPendingAttachments([]);
  };

  // Handle attachments
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
    const files = e.target.files;
    if (!files) return;

    const attachments: Attachment[] = Array.from(files).map((f) => ({
      type: type as "image" | "video" | "audio" | "file",
      file: f,
      url: URL.createObjectURL(f),
    }));

    setPendingAttachments((prev) => [...prev, ...attachments]);
    setShowAttachmentMenu(false);

    // Allow selecting same file again
    e.target.value = "";
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setText(currentText);
  };

//   const saveEditedMessage = async () => {
//     if (!editingMessageId) return;
//     try {
//       const result = await editGroupChatMessage({
//         chatroomId: Number(user.id),
//         messageId: Number(editingMessageId),
//         message: text,
//       });
//       toast.success(result?.message || "Message updated");
//       setMessages((prev) =>
//         dedupeMessages(
//           prev.map((m) =>
//             m.id === editingMessageId ? { ...m, content: text } : m
//           )
//         )
//       );
//       setEditingMessageId(null);
//       setText("");
//     } catch (err: any) {
//       toast.error(err?.message || "Failed to edit message");
//     }
//   };

const saveEditedMessage = async () => {
  if (!editingMessageId) return;
  try {
    const result = await editGroupChatMessage({
      chatroomId: Number(user.id),
      messageId: Number(editingMessageId),
      message: text,
    });
    toast.success(result?.message || "Message updated");

    setMessages((prev) => {
      const updated = prev.map((msg) =>
        msg.id === editingMessageId ? { ...msg, content: text } : msg
      );
      return [...updated]; // force new reference
    });

    setEditingMessageId(null);
    setText("");
  } catch (err: any) {
    toast.error(err?.message || "Failed to edit message");
  }
};

  useEffect(() => {
    if (!listRef.current) return;
    if (isAtBottom) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  const groupedMessages: Record<string, GetAllMessage[]> = messages.reduce(
    (groups: Record<string, GetAllMessage[]>, msg) => {
      if (!msg.created_at) return groups;
      const dayKey = new Date(msg.created_at).toDateString();
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(msg);
      return groups;
    },
    {}
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative">
      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
        <GroupMessages
          groupedMessages={groupedMessages}
          loginUser={loginUser}
          onEditMessage={handleEditMessage}
        />
      </div>

      {/* New message indicator */}
      {!isAtBottom && newMessageCount > 0 && (
        <div
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full cursor-pointer shadow-lg z-50"
        >
          {newMessageCount} New Message{newMessageCount > 1 ? "s" : ""}
        </div>
      )}

      {/* Pending attachments */}
      <PendingAttachments
        pendingAttachments={pendingAttachments}
        setPendingAttachments={setPendingAttachments}
        setPreviewModal={setPreviewModal}
      />

      {/* Input & Attachments */}
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
      />

      {/* Fullscreen preview modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <button
            onClick={() => setPreviewModal(null)}
            className="absolute top-4 right-4 p-2 rounded-full text-white"
          >
            <X className="w-6 h-6" />
          </button>
          {previewModal.type === "image" && (
            <img
              src={previewModal.url}
              alt="preview"
              className="max-w-[90%] max-h-[90%] rounded-lg"
            />
          )}
          {previewModal.type === "video" && (
            <video
              src={previewModal.url}
              controls
              autoPlay
              className="max-w-[90%] max-h-[90%] rounded-lg"
            />
          )}
        </div>
      )}
    </div>
  );
}
