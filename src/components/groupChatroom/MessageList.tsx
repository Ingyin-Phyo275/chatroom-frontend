import * as Avatar from "@radix-ui/react-avatar";
import { Pen, Pin, Trash } from "lucide-react";
import { formatMessageDate } from "../../hooks/helper";
import type { GetAllMessage } from "../../dto/response/GetAllMessage";
import type { loginResponse } from "../../dto/response/LoginResponse";
import AttachmentPreview from "./AttachmentPreview";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

type Props = {
  groupedMessages: Record<string, GetAllMessage[]>;
  loginUser: loginResponse;
  onEditMessage: (id: string, text: string) => void;
  onPin: (id: number) => void;
  onDelete: (id: number) => void;
};

export default function GroupMessages({
  groupedMessages,
  loginUser,
  onEditMessage,
  onPin,
  onDelete
}: Props) {
  //console.log("group messages", groupedMessages)
  return (
    <div className="space-y-3">
      {Object.keys(groupedMessages).length === 0 && (
        <div className="text-center text-sm text-slate-400 mt-6">
          No messages yet. Say hello 
        </div>
      )}

      {Object.keys(groupedMessages).map((dayKey) => (
        <div key={dayKey} className="space-y-3">
          {/* Date header */}
          <div className="flex justify-center">
            <span className="px-3 py-1 text-xs rounded-full bg-slate-300/70 dark:bg-slate-600/70">
              {formatMessageDate(dayKey)}
            </span>
          </div>

          {groupedMessages[dayKey].map((m) => {
            const isOwn = m.sender?.id === loginUser.user.id;

            return (
              <div
                key={m.id}
                className={`message-item flex ${
                  isOwn ? "justify-end" : "justify-start"
                } gap-3`}
                data-id={m.id}
                data-sender-id={m.sender?.id}
              >
                {/* Avatar for others */}
                {!isOwn && (
                  <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                    <Avatar.Image
                      src={(m.sender as any)?.avatar || undefined}
                      alt={m.sender?.username || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                    <Avatar.Fallback className="w-full h-full rounded-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                      {m.sender?.username
                        ? m.sender.username.slice(0, 2).toUpperCase()
                        : "U"}
                    </Avatar.Fallback>
                  </Avatar.Root>
                )}

                {/* Message + Context Menu */}
                <ContextMenu>
                  <div
                    className={`max-w-[70%] p-2 rounded-lg cursor-pointer ${
                      isOwn
                        ? "bg-primary text-white"
                        : "bg-slate-200 text-slate-900"
                    }`}
                  >
                    <ContextMenuTrigger>
                      <div>
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

                    {/* Time + status */}
                    <div className="text-xs text-slate-300 mt-1 flex justify-between gap-2">
                      {m.is_edit && (
                        <span className="italic text-gray-400">Edited</span>
                      )}
                      <span>
                        {new Date(m.created_at!).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>

                      {/* Status for own messages */}
                      {isOwn && (
                        <>
                          {m?.is_delivered && !m?.isRead && (
                            <span className="italic text-slate-300">
                              Delivered
                            </span>
                          )}
                          {m?.isRead && (
                            <span className="italic text-slate-300">Seen</span>
                          )}
                        </>
                      )}
                    </div>
                    
                  </div>

                  {/* Right-click Context Menu */}
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => onPin(Number(m.id))}
                    >
                      <Pin className="w-4 h-4 mr-2" /> Pin
                    </ContextMenuItem>

                    {isOwn && (
                      <ContextMenuItem
                        onClick={() =>
                          onEditMessage(String(m.id), m.content || "")
                        }
                      >
                        <Pen className="w-4 h-4 mr-2" /> Edit
                      </ContextMenuItem>
                    )}

                    {isOwn && (
                      <ContextMenuItem
                        onClick={() => onDelete(Number(m.id))}
                      >
                        <Trash className="w-4 h-4 mr-2" /> Delete
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
