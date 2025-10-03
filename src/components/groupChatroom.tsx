import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, ImageIcon, VideoIcon, Music, CheckCheck, Pin, Trash, File, Download, X, Pen } from "lucide-react";
import * as Avatar from "@radix-ui/react-avatar";
import AudioMessage from "./AudioPlayer";
import { socket } from "../socket/socket";
import { getChatroomDetails } from "../http/api/getChatroomDetails";
import { editGroupChatMessage } from "../http/api/editGroupChatMessage";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { formatMessageDate } from "../hooks/helper";
import type { loginResponse } from "../dto/response/LoginResponse";
import type { ChatUserType } from "../dto/UserTypes";
import type { GetAllMessage } from "../dto/response/GetAllMessage";
import { dedupeMessages } from "../utils/helper";
import { ChatroomUploadFile } from "../http/api/chatroomUploadFile";

type Attachment = { type: string; file: File; url?: string };
type Props = { user: ChatUserType; loginUser: loginResponse };

export default function GroupChatRoom({ user, loginUser }: Props) {
    const [messages, setMessages] = useState<GetAllMessage[]>([]);
    const [text, setText] = useState("");
    const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [previewModal, setPreviewModal] = useState<{ type: string; url: string } | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [messagesLoaded, setMessagesLoaded] = useState(false);
    const [attachmentType, setAttachmentType] = useState("image");

    //api call variables
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const [isAtBottom, setIsAtBottom] = useState(true);
    const [newMessageCount, setNewMessageCount] = useState(0);

    //accathments input
    const listRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imagePath, setImagePath] = useState<string | null>(null);

    // Join chatroom
    useEffect(() => {
        if (!user.id || !loginUser.user.id) return;
        socket.emit("join-room", { chatroom_id: user.id, user_id: loginUser.user.id });
    }, [user.id, loginUser.user.id]);

    // Listen for new messages
    useEffect(() => {
        const handleNewMessage = (msg: GetAllMessage) => {
            const senderId = msg.sender?.id?.toString();
            const chatroomId = msg.chatroom?.id?.toString();
            const userId = user.id.toString();
            const loginId = loginUser.user.id.toString();
            console.log("🔥 Incoming message:", msg);
            if (!msg.is_group || (senderId === userId && chatroomId === loginId) || (senderId === loginId && chatroomId === userId)) {
                setMessages((prev) => dedupeMessages([...prev, msg]));
            }
            
        };
        socket.on("receive-message", handleNewMessage);
        return () => {
            socket.off("receive-message", handleNewMessage);
        };
    }, [user.id, loginUser.user.id]);

    // Fetch a specific page
    const fetchPage = async (pageNumber: number) => {
        const chatroom = await getChatroomDetails({ chatroomId: Number(user.id), page: pageNumber, pageSize });
        const chatMessages: GetAllMessage[] = chatroom.messages.map((m: any) => ({
            id: m.id,
            sender: { id: m.sender?.id, username: m.sender?.username },
            chatroom: m.receiver ? { id: m.receiver?.id, username: m.receiver?.username } : undefined,
            content: m.content ?? "",
            created_at: m.created_at ?? new Date().toISOString(),
            attachment_url: m.attachment_url ?? null,
            is_delivered: m.is_delivered,
            is_pinned: m.is_pinned ?? false,
        }));
        console.log(totalPages);
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
                console.log("Call api first time")
                let currentPage = totalPage;
                let allMessages: GetAllMessage[] = [];
                let scrollable = false;

                while (!scrollable && currentPage > 0) {
                    const { chatMessages } = await fetchPage(currentPage);
                    console.log(`Call api second time ${currentPage}`)
                    allMessages = [...chatMessages, ...allMessages];
                    setMessages(dedupeMessages([...allMessages]));
                    await new Promise((r) => setTimeout(r, 50));

                    if (listRef.current && listRef.current.scrollHeight > listRef.current.clientHeight) {
                        scrollable = true;
                    } else {
                        currentPage--;
                    }
                }

                scrollToBottom();
                setPage(currentPage);
                setMessagesLoaded(true); // 
            } catch (err) {
                console.error("Failed to load latest messages:", err);
            }
        };

        loadLatestMessages();
    }, [user.id]);

    useEffect(() => {
        if (!messagesLoaded) return; // 
        const handleScroll = async () => {
            console.log("Scroll event");
            if (!listRef.current) return;
            const { scrollTop, scrollHeight, clientHeight } = listRef.current;
            const atBottom = scrollHeight - (scrollTop + clientHeight) < 50;
            setIsAtBottom(atBottom);
            if (atBottom) setNewMessageCount(0);

            if (scrollTop < 50 && !loadingMore && page > 1) {
                setLoadingMore(true);
                const nextPage = page - 1;
                try {
                    console.log(`Call api in scroll ${nextPage}`)
                    const { chatMessages } = await fetchPage(nextPage);
                    const currentScrollHeight = listRef.current.scrollHeight;
                    setMessages((prev) => dedupeMessages([...chatMessages, ...prev]));
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
        return () => currentList?.removeEventListener("scroll", handleScroll);
    }, [messagesLoaded, page, loadingMore, user.id]);

    const scrollToBottom = () => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    };

    // Send message
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
    socket.emit("edit-message", { message_id: editingMessageId, new_content: text.trim() });
    setEditingMessageId(null);
    setText("");
    return;
  }

  // If there are attachments, send each as a separate API call
  if (pendingAttachments.length > 0) {
    for (const att of pendingAttachments) {
      try {
        const result: any = await ChatroomUploadFile(att.file, user?.id, text.trim());

        const uploadedUrl = result?.data?.[0]?.attachment_url ?? null;
        const imagePath = result?.data?.[0]?.imagePath ?? null;
        const attachmentTypeToSend = result?.attachment_type ?? attachmentType;
        console.log("attchment url", uploadedUrl);
        // console.log("imagePath", imagePath);

        const newMsg: GetAllMessage = {
          id: Date.now().toString(),
          sender: { id: loginUser.user.id, username: loginUser.user.name },
          chatroom: { id: user.id, username: user.username },
          content: text.trim(),
          created_at: new Date().toISOString(),
          attachment_urls: uploadedUrl ? [uploadedUrl] : [],
          attachment_url: uploadedUrl,
          imagePath: imagePath,
          is_delivered: true,
          is_pinned: false,
          is_group: true,
        };

        // Add locally
        setMessages((prev) => dedupeMessages([...prev, newMsg]));
        scrollToBottom();

        // Emit to server
        socket.emit("chat-message", {
          sender_id: newMsg.sender?.id,
          chatroom_id: newMsg.chatroom?.id,
          content: newMsg.content,
          attachment_urls: uploadedUrl ? [uploadedUrl] : [],
          attachment_type: attachmentTypeToSend,
          imagePath: imagePath,
          is_group: true,
        });

      } catch (error) {
        console.error("Upload failed:", error);
        toast?.error?.("Attachment upload failed");
      }
    }
  } else {
    // no attachments,  send a text message
    const newMsg: GetAllMessage = {
      id: Date.now().toString(),
      sender: { id: loginUser.user.id, username: loginUser.user.name },
      chatroom: { id: user.id, username: user.username },
      content: text.trim(),
      created_at: new Date().toISOString(),
      attachment_urls: [],
      imagePath: null,
      is_delivered: true,
      is_pinned: false,
      is_group: true,
    };

    setMessages((prev) => dedupeMessages([...prev, newMsg]));
    socket.emit("chat-message", {
      sender_id: newMsg.sender?.id,
      chatroom_id: newMsg.chatroom?.id,
      content: newMsg.content,
      attachment_urls: [],
      attachment_type: attachmentType,
      imagePath: null,
      is_group: true,
    });
  }

  setText("");
  setPendingAttachments([]);
};

    // Handle attachments
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
        const attachments: Attachment[] = Array.from(files).map((f) => ({ type, file: f }));
        setPendingAttachments((prev) => [...prev, ...attachments]);
        setShowAttachmentMenu(false);

    };

    const handleEditMessage = (messageId: string, currentText: string) => {
        setEditingMessageId(messageId);
        setText(currentText);
    };

    const saveEditedMessage = async () => {
        if (!editingMessageId) return;
        try {
            const result = await editGroupChatMessage({
                chatroomId: Number(user.id),
                messageId: Number(editingMessageId),
                message: text,
            });
            toast.success(result?.message || "Message updated");
            setMessages((prev) => dedupeMessages(prev.map((m) => (m.id === editingMessageId ? { ...m, content: text } : m))));
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

    // helpers to detect file types safely
    // const filePathFromUrl = (url?: string | null) => {
    //     if (!url) return null;
    //     try {
    //         return new URL(url).pathname;
    //     } catch {
    //         return url;
    //     }
    // };

    function AttachmentPreview({ url }: { url: string }) {
        const filePath = (() => {
            try {
                return new URL(url).pathname;
            } catch {
                return url;
            }
        })();

        if (filePath.match(/\.(jpeg|jpg|png|gif)$/i)) {
            return (
                <img
                    src={url}
                    className="max-w-full max-h-60 rounded-lg mb-1"
                    alt="attachment"
                />
            );
        }

        if (filePath.match(/\.(mp4|webm)$/i)) {
            return (
                <video
                    src={url}
                    controls
                    className="max-w-full max-h-60 rounded-lg mb-1"
                />
            );
        }

        if (filePath.match(/\.(mp3|wav)$/i)) {
            return <AudioMessage file={url} />;
        }

        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline block mb-1"
            >
                Download file
            </a>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] relative">
            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
                {Object.keys(groupedMessages).map((dayKey) => (
                    <div key={dayKey} className="space-y-3">
                        <div className="flex justify-center">
                            <span className="px-3 py-1 text-xs rounded-full bg-slate-300/70 dark:bg-slate-600/70">
                                {formatMessageDate(dayKey)}
                            </span>
                        </div>

                        {groupedMessages[dayKey].map((m) => {
                            const isOwn = m.sender?.id === loginUser.user.id;
                            // console.log("attachment urls", m);
                            return (
                                <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-3`}>
                                    {!isOwn && (
                                        <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                                            <Avatar.Image
                                                src={(m.sender as any)?.avatar || undefined}
                                                alt={m.sender?.username || "User"}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                            <Avatar.Fallback className="w-full h-full rounded-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                                                {m.sender?.username ? m.sender.username.slice(0, 2).toUpperCase() : "U"}
                                            </Avatar.Fallback>
                                        </Avatar.Root>
                                    )}

                                    {/* Message actions */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div
                                                className={`max-w-[70%] p-2 rounded-lg cursor-pointer ${isOwn ? "bg-primary text-white" : "bg-slate-200 text-slate-900"
                                                    }`}
                                            >
                                                {/* Content (text + attachments) */}
                                                <div>
                                                    {m.content && <p className="mb-1">{m.content}</p>}

                                                    {/* Single attachment (backward compatibility) */}
                                                    {m.attachment_url && (
                                                        <AttachmentPreview url={m.attachment_url} />
                                                    )}

                                                    {/* Multiple attachments
                                                    {m.attachment_urls &&
                                                        m.attachment_urls.map((url, idx) => (
                                                            
                                                                <AttachmentPreview key={idx} url={url} />
                                                            
                                                        ))} */}
                                                </div>

                                                {/* Footer: time + status */}
                                                <div className="text-xs text-slate-300 mt-1 flex justify-between">
                                                    <span>
                                                        {new Date(m.created_at!).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                    {isOwn && m.is_delivered && (
                                                        <CheckCheck className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                            </div>

                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent className="flex flex-row gap-3 mr-3" side="top">
                                            <DropdownMenuItem onClick={() => alert(`Pin message: ${m.id}`)}>
                                                <Pin className="w-4 h-4 mr-2" /> Pin
                                            </DropdownMenuItem>
                                            {isOwn && (
                                                <DropdownMenuItem onClick={() => handleEditMessage(String(m.id), m.content || "")}>
                                                    <Pen className="w-4 h-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                            )}
                                            {isOwn && (
                                                <DropdownMenuItem onClick={() => alert(`Delete message: ${m.id}`)}>
                                                    <Trash className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            );
                        })}
                    </div>
                ))}
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
            {pendingAttachments.length > 0 && (
                <div className="p-2 flex gap-3 overflow-x-auto border-t border-b bg-slate-100 dark:bg-slate-800">
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
                                <a
                                    href={URL.createObjectURL(att.file)}
                                    download={att.file.name}
                                    className="p-1 rounded text-green-600 hover:text-white hover:bg-green-600"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                                    className="p-1 rounded text-red-600 hover:text-white hover:bg-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Input & Attachments */}
            <div className="p-4 border-t flex gap-2 items-center">
                <div className="relative">
                    <button onClick={() => setShowAttachmentMenu((prev) => !prev)} className="p-2 rounded hover:bg-slate-200">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    {showAttachmentMenu && (
                        <div className="absolute bottom-full left-0 mb-2 flex flex-col bg-white border rounded shadow-lg z-10">
                            <button onClick={() => handleAttachmentClick("image")} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100">
                                <ImageIcon className="w-4 h-4" /> Image
                            </button>
                            <button onClick={() => handleAttachmentClick("video")} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100">
                                <VideoIcon className="w-4 h-4" /> Video
                            </button>
                            <button onClick={() => handleAttachmentClick("audio")} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100">
                                <Music className="w-4 h-4" /> Audio
                            </button>
                            <button onClick={() => handleAttachmentClick("file")} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100">
                                <Send className="w-4 h-4" /> File
                            </button>
                        </div>
                    )}
                </div>

                <input type="file" accept="image/*" multiple className="hidden" ref={imageInputRef} onChange={(e) => handleFileSelect(e, "image")} />
                <input type="file" accept="video/*" multiple className="hidden" ref={videoInputRef} onChange={(e) => handleFileSelect(e, "video")} />
                <input type="file" accept="audio/*" multiple className="hidden" ref={audioInputRef} onChange={(e) => handleFileSelect(e, "audio")} />
                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => handleFileSelect(e, "file")} />

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
                    className="flex-1 rounded-2xl resize-none p-2 min-h-[44px] max-h-40 border focus:outline-none"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            editingMessageId ? saveEditedMessage() : sendMessage();
                        }
                    }}
                />

                {editingMessageId && (
                    <button onClick={() => { setEditingMessageId(null); setText(""); }} className="px-3 py-1 rounded bg-gray-300 text-gray-800 mr-2">
                        Cancel
                    </button>
                )}

                <button onClick={editingMessageId ? saveEditedMessage : sendMessage} className="px-4 py-2 rounded-xs bg-primary text-white">
                    <Send size={16} />
                </button>
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
