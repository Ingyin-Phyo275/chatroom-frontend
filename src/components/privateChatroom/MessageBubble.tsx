import React from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { File, Pen, Trash, Pin, CornerUpLeft } from "lucide-react";
import { DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  toggleTime: () => void;
  filePath?: string;
  setPreviewModal: (modal: { type: string; url: string }) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: number, deleteForEveryone: boolean) => void;
  onPin: (id: number) => void;
  setForwardMessageId: (id: number) => void;
  setShowForwardDialog: (state: boolean) => void;
  setIsReacted: (state: boolean) => void;
  setEmoji: (emoji: string) => void;
  handleSendReaction: (react: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  toggleTime,
  filePath,
  setPreviewModal,
  onEdit,
  onDelete,
  onPin,
  setForwardMessageId,
  setShowForwardDialog,
  handleSendReaction,
}) => {
  const REACTIONS = [
    { icon: "❤️", label: "love" },
    { icon: "😂", label: "haha" },
    { icon: "👍", label: "like" },
    { icon: "😮", label: "wow" },
    { icon: "😢", label: "sad" },
    { icon: "😡", label: "angry" },
  ];
  return (
    <div
      onClick={toggleTime}
      className={`max-w-[100%] p-2 rounded-lg cursor-pointer transition ${
        isOwn
          ? "bg-primary text-white rounded-br-none hover:bg-primary/90"
          : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none hover:bg-slate-300/80"
      }`}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          {message?.content}
          {message.duration && (
            <p
              className={`text-xs ${
                isOwn ? "text-slate-200" : "text-slate-400"
              }`}
            >
              Duration: {message.duration}
            </p>
          )}
          {message.attachment_url && (
            <div>
              {filePath?.match(/\.(jpeg|jpg|png|gif)$/i) && (
                <img
                  src={message.attachment_url}
                  alt="attachment"
                  className="max-w-full max-h-60 rounded-lg cursor-pointer"
                  onClick={() =>
                    setPreviewModal({
                      type: "image",
                      url: message.attachment_url,
                    })
                  }
                />
              )}
              {filePath?.match(/\.(mp4|webm)$/i) && (
                <video
                  src={message.attachment_url}
                  controls
                  className="max-w-full max-h-60 rounded-lg"
                />
              )}
              {filePath?.match(/\.(mp3|wav)$/i) && (
                <audio controls src={message.attachment_url} />
              )}
              {!filePath?.match(/\.(jpeg|jpg|png|gif|mp4|webm|mp3|wav)$/i) && (
                <div className="relative flex flex-col items-center justify-center w-[200px] h-[200px] bg-gray-100 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                  <File
                    className="w-12 h-12 text-slate-500 mb-2"
                    onClick={() =>
                      setPreviewModal({
                        type: "file",
                        url: message.attachment_url,
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}
        </ContextMenuTrigger>
        <div className="flex justify-between items-center mt-1 text-xs text-slate-300 gap-2">
          {message?.is_edit && (
            <span className="text-grey-500 italic">Edited</span>
          )}
          {isOwn && (
            <span className="ml-2 flex items-center gap-1">
              {message?.is_delivered && !message?.isRead && (
                <span className="italic text-slate-300">Delivered</span>
              )}
              {message?.isRead && (
                <span className="italic text-slate-300">Seen</span>
              )}
            </span>
          )}
        </div>
        <ContextMenuContent>
          <div className="flex  gap-2 px-2 py-1 border-b border-slate-200 dark:border-slate-600">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji?.label}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendReaction(emoji.label);
                }}
                className="text-xl hover:scale-125 transition"
              >
                {emoji?.icon}
              </button>
            ))}
          </div>
          <Separator />
          {isOwn &&
            !filePath?.match(/\.(jpeg|jpg|png|gif|mp4|webm|mp3|wav)$/i) && (
              <ContextMenuItem
                onClick={() => onEdit(message.id, message.content || "")}
              >
                <Pen className="w-4 h-4 mr-2" /> Edit
              </ContextMenuItem>
            )}
          {isOwn && (
            <ContextMenuSub>
              <ContextMenuSubTrigger className="flex items-center px-2 py-2">
                <Trash className="w-4 h-4 mr-4" /> Delete
              </ContextMenuSubTrigger>

              <ContextMenuSubContent className="w-44">
                <ContextMenuItem
                  onClick={() => onDelete(Number(message.id), false)}
                >
                  Delete For Me
                </ContextMenuItem>
                <DropdownMenuSeparator />
                <ContextMenuItem
                  onClick={() => onDelete(Number(message.id), true)}
                >
                  Delete For Everyone
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          <ContextMenuItem onClick={() => onPin(Number(message.id))}>
            <Pin className="w-4 h-4 mr-2" /> Pin
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => {
              setForwardMessageId(Number(message.id));
              setShowForwardDialog(true);
            }}
          >
            <CornerUpLeft className="w-4 h-4 mr-2" /> Forward
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export default MessageBubble;
