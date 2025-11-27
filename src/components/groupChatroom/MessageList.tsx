import * as React from "react";
import * as Avatar from "@radix-ui/react-avatar";
import { CornerUpLeft, Pen, Pin, Trash } from "lucide-react";
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
import { userListQuery } from "../../composables/Queries/userListQuery";
import type { ChatUserType } from "../../dto/UserTypes";
import type { UserListResponse } from "../../dto/response/UserListResponse";
import ForwardDialog from "./ForwardDialog";
import { useGroupChatList } from "../../composables/Queries/useGroupChatList";
import type { GroupChatResponse } from "../../dto/response/ChatRoom";

type Props = {
  groupedMessages: Record<string, GetAllMessage[]>;
  loginUser: loginResponse;
  onEditMessage: (id: string, text: string) => void;
  onPin: (id: number) => void;
  onDelete: (id: number) => void;
  onForward: (id: number, receiverIds: number[], groupIds: number[]) => void;
  onReact: (id: number, emoji: string) => void;
};

type SelectedItem = { type: "user" | "group"; id: number };

// Reaction choices
const REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "😡"];

export default function GroupMessages({
  groupedMessages,
  loginUser,
  onEditMessage,
  onPin,
  onDelete,
  onForward,
  onReact,
}: Props) {
  const [selectedMessageId, setSelectedMessageId] = React.useState<
    string | null
  >(null);
  const handleToggleTime = (id: string) => {
    setSelectedMessageId((prev) => (prev === id ? null : id));
  };

  const [showForwardDialog, setShowForwardDialog] = React.useState(false);
  const [forwardMessageId, setForwardMessageId] = React.useState<number | null>(
    null
  );

  const { userListData } = userListQuery();

  const chatUsers: ChatUserType[] =
    userListData?.map((u: UserListResponse) => ({
      id: u.id,
      username: u.username,
      avatar_url: u.avatar_url,
      status: typeof u.status === "string" ? u.status : "",
    })) || [];

  const { groupChatListQuery: groupChatList = [] as GroupChatResponse[] } =
    useGroupChatList({ page: 1, pageSize: 15 });

  const [selectedUsers, setSelectedUsers] = React.useState<SelectedItem[]>([]);

  const toggleUserSelection = (item: SelectedItem) => {
    setSelectedUsers((prev) =>
      prev.some((i) => i.type === item.type && i.id === item.id)
        ? prev.filter((i) => !(i.type === item.type && i.id === item.id))
        : [...prev, item]
    );
  };

  React.useEffect(() => {
    if (showForwardDialog) setSelectedUsers([]);
  }, [showForwardDialog]);

  const handleForward = (messageId: number, items: SelectedItem[]) => {
    const userIds = items.filter((i) => i.type === "user").map((i) => i.id);
    const groupIds = items.filter((i) => i.type === "group").map((i) => i.id);
    onForward(messageId, userIds, groupIds);
  };

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
            const isSelected = selectedMessageId === m.id.toString();

            return (
              <div
                key={m.id}
                className={`message-item flex items-end gap-2 ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
                data-id={m.id}
              >
                {/* Avatar */}
                {!isOwn && (
                  <Avatar.Root className="w-9 h-9 rounded-full overflow-hidden self-start">
                    <Avatar.Image
                      src={(m.sender as any)?.avatar || undefined}
                      alt={m.sender?.username || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                    <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                      {m.sender?.username
                        ? m.sender.username.slice(0, 2).toUpperCase()
                        : "U"}
                    </Avatar.Fallback>
                  </Avatar.Root>
                )}

                {/* Message */}
                <div
                  className={`flex flex-col ${
                    isOwn ? "items-end" : "items-start"
                  } gap-1`}
                >
                  <ContextMenu>
                    <div
                      onClick={() => handleToggleTime(String(m.id))}
                      className={`max-w-[100%] p-2 rounded-lg cursor-pointer transition ${
                        isOwn
                          ? "bg-primary text-white rounded-br-none hover:bg-primary/90"
                          : "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 rounded-bl-none hover:bg-slate-300/80"
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
                        {REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => onReact(Number(m.id), emoji)}
                            className="text-xl hover:scale-125 transition"
                          >
                            {emoji}
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
                        <ContextMenuItem onClick={() => onDelete(Number(m.id))}>
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

                  {/* Reaction display under message */}
                  {Array.isArray(m.reactions) && m.reactions.length > 0 && (
                    <div
                      className={`flex gap-1 mt-1 ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      {Object.entries(
                        m.reactions.reduce((acc: any, r: any) => {
                          acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([emoji, count]) => (
                        <span
                          key={emoji}
                          className="px-2 py-0.5 text-sm bg-slate-200 dark:bg-slate-700 rounded-full flex items-center gap-1"
                        >
                          {emoji}{" "}
                          <span className="text-xs">{count as number}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Time display */}
                  {isSelected && (
                    <span
                      className={`text-[11px] mt-1 transition-opacity ${
                        isOwn ? "text-slate-400 pr-1" : "text-slate-500 pl-1"
                      }`}
                    >
                      {new Date(m.created_at!).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Forward dialog */}
      {showForwardDialog && forwardMessageId !== null && (
        <ForwardDialog
          open={showForwardDialog}
          onClose={() => setShowForwardDialog(false)}
          chatUsers={chatUsers}
          groupChats={groupChatList}
          selectedUsers={selectedUsers}
          toggleUserSelection={toggleUserSelection}
          sendForward={handleForward}
          messageId={forwardMessageId}
        />
      )}
    </div>
  );
}
