import * as React from "react";
import type { PrivateChatMessage } from "@/dto/response/PrivateChatMessage";
import type { ChatUserType } from "@/dto/UserTypes";
import * as Avatar from "@radix-ui/react-avatar";
import { File, Pen, Pin, Trash } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DropdownMenuSeparator } from "../ui/dropdown-menu";

export default function MessageItem({
  message,
  isOwn,
  user,
  filePath,
  onEdit,
  setPreviewModal,
  onDelete,
  onPin,
}: {
  message: PrivateChatMessage;
  isOwn: boolean;
  user: ChatUserType;
  filePath: string;
  onEdit: (id: string, content: string) => void;
  setPreviewModal: (preview: any) => void;
  onDelete: (messageId: number, is_everyone: boolean) => void;
  onPin: (messageId: number) => void;
}) {
  const sender = user;

  //  Track time visibility
  const [showTime, setShowTime] = React.useState(false);

  const toggleTime = () => setShowTime((prev) => !prev);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-3`}>
      {/* Avatar (only for other user) */}
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
      <div
        className={`message-item flex flex-col ${
          isOwn ? "items-end" : "items-start"
        } gap-1`}
        data-id={message.id}
        data-sender-id={
          typeof message.sender === "object"
            ? message.sender.id
            : message.sender
        }
      >
        <ContextMenu>
          <div
            onClick={toggleTime} //toggle time on click
            className={`max-w-[100%] p-2 rounded-lg cursor-pointer transition ${
              isOwn
                ? "bg-primary text-white rounded-br-none hover:bg-primary/90"
                : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none hover:bg-slate-300/80"
            }`}
          >
            <ContextMenuTrigger>
              {/* Message text */}
              {message?.content && message?.content}

              {/* Duration (for media) */}
              {message.duration && (
                <p
                  className={`text-xs ${
                    isOwn ? "text-slate-200" : "text-slate-400"
                  }`}
                >
                  Duration: {message.duration}
                </p>
              )}

              {/* Attachments */}
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

                  {!filePath?.match(
                    /\.(jpeg|jpg|png|gif|mp4|webm|mp3|wav)$/i
                  ) && (
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

            {/* Footer inside bubble */}
            <div className="flex justify-between items-center mt-1 text-xs text-slate-300 gap-2">
              {message?.is_edit === true && (
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

            {/* Context Menu Items */}
            <ContextMenuContent>
              {/* Edit */}
              {isOwn &&
                !filePath?.match(
                  /\.(jpeg|jpg|png|gif|mp4|webm|mp3|wav)$/i
                ) && (
                  <ContextMenuItem
                    onClick={() => onEdit(message.id, message.content || "")}
                  >
                    <Pen className="w-4 h-4 mr-2" /> Edit
                  </ContextMenuItem>
                )}

              {/* Delete submenu */}
              {isOwn && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <Trash className="w-4 h-4 mr-auto" /> Delete
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

              {/* Pin */}
              <ContextMenuItem onClick={() => onPin(Number(message.id))}>
                <Pin className="w-4 h-4 mr-2" /> Pin
              </ContextMenuItem>
            </ContextMenuContent>
          </div>
        </ContextMenu>

        {/* Time BELOW the bubble — only when clicked */}
        {showTime && (
          <span
            className={`text-[11px] mt-1 transition-opacity ${
              isOwn ? "text-slate-400 pr-2" : "text-slate-500 pl-2"
            }`}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        )}
      </div>
    </div>
  );
}
