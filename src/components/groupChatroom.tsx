import { useEffect, useRef, useState } from "react";
import {
    Send,
    Paperclip,
    ImageIcon,
    VideoIcon,
    Music,
    CheckCheck,
} from "lucide-react";
import * as Avatar from "@radix-ui/react-avatar";
import AudioMessage from "./AudioPlayer";
import { socket } from "../socket/socket";
import { getChatroomDetails } from "../http/api/getChatroomDetails";
import type { loginResponse } from "../dto/response/LoginResponse";

type Attachment = { type: string; file: File; url?: string };

type User = {
    id: number | string;
    username: string;
    avatar_url?: string | null;
    status?: string;
};

type Props = {
    user: User;
    loginUser: loginResponse;
};

export interface GetAllMessage {
    id: number | string;
    sender?: { id: number | string; username?: string };
    chatroom?: { id: number | string; username?: string };
    content?: string;
    created_at?: string;
    attachment_url?: string | null;
    is_delivered?: boolean;
    is_pinned?: boolean;
    is_group?: boolean;
}

export default function GroupChatRoom({ user, loginUser }: Props) {
    const [messages, setMessages] = useState<GetAllMessage[]>([]);
    const [text, setText] = useState("");
    const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

    const listRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        if (!user.id || !loginUser.user.id) return;
        socket.emit("join-room", {
            chatroom_id: user.id,
            user_id: loginUser.user.id,
        });
    }, [user.id, loginUser.user.id]);


    useEffect(() => {
        const handleNewMessage = (msg: GetAllMessage) => {
            console.log("🔥 Incoming message:", msg);

            // Normalize IDs to string for safe comparison
            const senderId = msg.sender?.id?.toString();
            const chatroomId = msg.chatroom?.id?.toString();
            const userId = user.id.toString();
            const loginId = loginUser.user.id.toString();

            if (
                !msg.is_group ||
                (senderId === userId && chatroomId === loginId) ||
                (senderId === loginId && chatroomId === userId)
            ) {
                console.log("📩 Passed filter, adding to UI:", msg);
                setMessages((prev) => [...prev, msg]);
            }
        };

        socket.on("receive-message", handleNewMessage);
        return () => {
            socket.off("receive-message", handleNewMessage);
        };
    }, [user.id, loginUser.user.id]);


    useEffect(() => {
        if (!user.id || !loginUser.user.id) return;
        const fetchMessages = async () => {
            try {
                const chatroom = await getChatroomDetails(String(user.id));
                const chatMessages: GetAllMessage[] = chatroom.messages.map((m: any) => ({
                    id: m.id,
                    sender: { id: m.sender.id, username: m.sender.username },
                    chatroom: m.receiver ? { id: m.receiver.id, username: m.receiver.username } : undefined,
                    content: m.content ?? "",
                    created_at: m.created_at ?? new Date().toISOString(),
                    attachment_url: m.attachment_url ?? null,
                    is_delivered: m.is_delivered ?? true,
                    is_pinned: m.is_pinned ?? false,
                }));
                setMessages(chatMessages);
            } catch (err) {
                console.error("Failed to fetch group messages:", err);
            }
        };
        fetchMessages();
    }, [user.id, loginUser.user.id]);

    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages]);

    const sendMessage = () => {
        if (!text.trim() && pendingAttachments.length === 0) return;

        const newMsg: GetAllMessage = {
            id: Date.now().toString(),
            sender: { id: loginUser.user.id, username: loginUser.user.name },
            chatroom: { id: user.id, username: user.username },
            content: text.trim(),
            created_at: new Date().toISOString(),
            attachment_url: null,
            is_delivered: true,
            is_pinned: false,
            is_group: true,
        };

        setMessages((prev) => [...prev, newMsg]);
        setText("");
        setPendingAttachments([]);

        socket.emit("chat-message", {
            sender_id: newMsg.sender?.id,
            chatroom_id: newMsg.chatroom?.id,
            content: newMsg.content,
            attachment_url: newMsg.attachment_url,
            is_group: true,
        });
    };


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


    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
                {messages.map((m) => {
                    const isOwn = m.sender?.id === loginUser.user.id;
                    return (
                        <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-3`}>
                            {!isOwn && (
                                <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                                    <Avatar.Image
                                        src={(m.sender as any)?.avatar || undefined} // sender's avatar
                                        alt={m.sender?.username || "User"}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                    <Avatar.Fallback className="w-full h-full rounded-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                                        {m.sender?.username ? m.sender.username.slice(0, 2).toUpperCase() : "U"}
                                    </Avatar.Fallback>
                                </Avatar.Root>
                            )}

                            <div className={`max-w-[70%] p-2 rounded-lg ${isOwn ? "bg-primary text-white" : "bg-slate-200 text-slate-900"}`}>
                                {m.attachment_url ? (
                                    <div>
                                        {m.attachment_url.match(/\.(jpeg|jpg|png|gif)$/i) && <img src={m.attachment_url} className="max-w-full max-h-60 rounded-lg" />}
                                        {m.attachment_url.match(/\.(mp4|webm)$/i) && <video src={m.attachment_url} controls className="max-w-full max-h-60 rounded-lg" />}
                                        {m.attachment_url.match(/\.(mp3|wav)$/i) && <AudioMessage file={m.attachment_url} />}
                                        {!m.attachment_url.match(/\.(jpeg|jpg|png|gif|mp4|webm|mp3|wav)$/i) && (
                                            <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                                Download file
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    m.content
                                )}

                                <div className="text-xs text-slate-300 mt-1 flex justify-between">
                                    <span>{new Date(m.created_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                    {isOwn && m.is_delivered && <CheckCheck className="w-3 h-3 text-white" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Attachments & Input */}
            <div className="p-4 border-t flex gap-2 items-center">
                <div className="relative">
                    <button onClick={() => setShowAttachmentMenu((prev) => !prev)} className="p-2 rounded hover:bg-slate-200"><Paperclip className="w-5 h-5" /></button>
                    {showAttachmentMenu && (
                        <div className="absolute bottom-full left-0 mb-2 flex flex-col bg-white border rounded shadow-lg z-10">
                            <button onClick={() => handleAttachmentClick("image")} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100"><ImageIcon className="w-4 h-4" /> Image</button>
                            <button onClick={() => handleAttachmentClick("video")} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100"><VideoIcon className="w-4 h-4" /> Video</button>
                            <button onClick={() => handleAttachmentClick("audio")} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100"><Music className="w-4 h-4" /> Audio</button>
                            <button onClick={() => handleAttachmentClick("file")} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100"><Send className="w-4 h-4" /> File</button>
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
                    placeholder="Type a message..."
                    className="flex-1 rounded-2xl resize-none p-2 min-h-[44px] max-h-40 border focus:outline-none"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <button onClick={sendMessage} className="px-4 py-2 rounded-full bg-primary text-white"><Send /></button>
            </div>
        </div>
    );
}
