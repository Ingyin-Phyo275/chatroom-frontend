import type { PrivateChatMessage } from "@/dto/response/PrivateChatMessage";
import type { ChatUserType } from "@/dto/UserTypes";
import * as Avatar from "@radix-ui/react-avatar";
import { CheckCheck, Download } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export default function MessageItem({
  message,
  isOwn,
  user,
  filePath,
  onEdit,
  onDownload,
  setPreviewModal,
  onDelete
}: {
  message: PrivateChatMessage;
  isOwn: boolean;
  user: ChatUserType;
  filePath: string
  onEdit: (id: string, content: string) => void;
  onDownload: (url: string, filename: string) => void;
  setPreviewModal: (preview: any) => void;
  onDelete: (messageId: number) => void;
}) {
  const sender = user;
  // console.log("props", message?.is_delivered)

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-3`}>
      {/* Avatar */}
      {!isOwn && (
        <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
          <Avatar.Image
            src={sender.avatar_url || user.avatar_url}
            alt={sender.username}
            className="w-full h-full object-cover"
          />
          <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-500 text-white font-semibold">
            {(sender.username || "U").slice(0, 2).toUpperCase()}
          </Avatar.Fallback>
        </Avatar.Root>
      )}

      {/* Message bubble */}
      <ContextMenu>

        <div
          className={`max-w-[70%] p-2 rounded-lg ${isOwn
            ? "bg-primary text-white rounded-br-none"
            : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none"
            }`}
        >
          <ContextMenuTrigger>
            {message?.content && message?.content}

            {/* Message content */}
            {message.attachment_url && (
              
              <div>
                {filePath?.match(/\.(jpeg|jpg|png|gif)$/i) && (
                  <img
                    src={message.attachment_url}
                    alt="attachment"
                    className="max-w-full max-h-60 rounded-lg cursor-pointer"
                    onClick={() =>
                      setPreviewModal({ type: "image", url: message.attachment_url })
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
                  <audio controls src={message.attachment_url} className="w-full" />
                )}

                {!filePath?.match(/\.(jpeg|jpg|png|gif|mp4|webm|mp3|wav)$/i) && (
                  <div className="flex items-center gap-2">
                    <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                      Open file
                    </a>
                    <button
                      onClick={() => onDownload(message.attachment_url!, message.attachment_url!.split("/").pop() || "file")}
                      className="p-1 rounded text-green-600 hover:text-white hover:bg-green-600"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) }
          </ContextMenuTrigger>

          {/* Footer: time & actions */}
          <div className="flex justify-between items-center mt-1 text-xs text-slate-300">
            <span>
              {new Date(message.created_at || message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>


            {isOwn && (
              <span className="ml-2 flex items-center gap-1">
                {message.is_delivered && <CheckCheck className="w-3 h-3 text-green" />}
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onEdit(message.id, message.content || message.content)}>Edit</ContextMenuItem>
                  <ContextMenuItem onClick={() => onDelete(Number(message.id))}>Delete</ContextMenuItem>
                  <ContextMenuItem>Pin</ContextMenuItem>
                </ContextMenuContent>

              </span>
            )}
          </div>
        </div>
      </ContextMenu>
    </div>
  );
}
