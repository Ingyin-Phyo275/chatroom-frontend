import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import AttachmentPreview from "./AttachmentPreview";
import { CornerUpLeft, Pen, Pin, Trash } from "lucide-react";
import type { GetAllMessage } from "../../dto/response/GetAllMessage";

type Props = {
    m: GetAllMessage;
    isOwn: boolean;
    handleToggleTime: (id: string) => void;
    onEditMessage: (id: string, text: string) => void;
    onPin: (id: number) => void;
    onDelete: (id: number) => void;
    onForward: (id: number, receiverIds: number[], groupIds: number[]) => void;
    handleSendReaction: (messageId: string, react: string) => void
    setForwardMessageId: (id: number) => void,
    setShowForwardDialog: (state: boolean) => void
}

export default function MessageBubble({ m, isOwn, handleToggleTime, onEditMessage, onPin, onDelete, setForwardMessageId, setShowForwardDialog, handleSendReaction }: Props) {
    const Reactions = [
  { icon: "❤️", label: "love" },
  { icon: "😂", label: "haha" },
  { icon: "👍", label: "like" },
  { icon: "😮", label: "wow" },
  { icon: "😢", label: "sad" },
  { icon: "😡", label: "angry" },
];


    return (
        <div>
            <ContextMenu>
                <div
                    onClick={() => handleToggleTime(String(m.id))}
                    className={`max-w-[100%] p-2 rounded-lg cursor-pointer transition ${isOwn
                            ? "bg-primary text-white rounded-br-none hover:bg-primary/90"
                            : "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 rounded-bl-none hover:bg-slate-300/80"
                        }`}
                >
                    <ContextMenuTrigger>
                        <div>
                            {m.forwarded_from_id && (
                                <p className="text-xs text-gray-300 italic">Forward from {m.forwarded_from_id}</p>
                            )}
                            {m.content && <p className="mb-1">{m.content}</p>}
                            {/* Attachments */}
                            {Array.isArray(m.attachment_url)
                                ? m.attachment_url.map((url, i) => (
                                    <AttachmentPreview key={i} urls={url} />
                                ))
                                : m.attachment_url && (
                                    <AttachmentPreview urls={m.attachment_url} />
                                )}
                        </div>
                    </ContextMenuTrigger>

                    {/* Edited + status */}
                    <div className="flex justify-between items-center mt-1 text-xs text-slate-300 gap-2">
                        {m.is_edit && (
                            <span className="italic text-gray-400">Edited</span>
                        )}

                        {isOwn && (
                            <>
                                {m?.is_delivered && !m?.isRead && (
                                    <span className="italic text-slate-300">
                                        Delivered
                                    </span>
                                )}
                                {m?.isRead && (
                                    <span className="italic text-slate-300">
                                        Seen
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* CONTEXT MENU */}
                <ContextMenuContent>

                    {/* REACTION BAR */}
                    <div className="flex gap-2 px-2 py-1 border-b border-slate-200 dark:border-slate-600">
                        {Reactions.map((emoji) => (
                            <button
                                key={emoji?.label}
                                onClick={() =>
                                    handleSendReaction(String(m?.id), emoji?.label)
                                }
                                className="text-xl hover:scale-125 transition"
                            >
                                {emoji?.icon}
                            </button>
                        ))}
                    </div>

                    {/* Pin */}
                    <ContextMenuItem onClick={() => onPin(Number(m.id))}>
                        <Pin className="w-4 h-4 mr-2" /> Pin
                    </ContextMenuItem>

                    {/* Edit */}
                    {isOwn && (
                        <ContextMenuItem
                            onClick={() =>
                                onEditMessage(String(m.id), m.content || "")
                            }
                        >
                            <Pen className="w-4 h-4 mr-2" /> Edit
                        </ContextMenuItem>
                    )}

                    {/* Delete */}
                    {isOwn && (
                        <ContextMenuItem
                            onClick={() => onDelete(Number(m.id))}
                        >
                            <Trash className="w-4 h-4 mr-2" /> Delete
                        </ContextMenuItem>
                    )}

                    {/* Forward */}
                    <ContextMenuItem
                        onClick={() => {
                            setForwardMessageId(Number(m.id));
                            setShowForwardDialog(true);
                        }}
                    >
                        <CornerUpLeft className="w-4 h-4 mr-2" /> Forward
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </div>
    )
}
