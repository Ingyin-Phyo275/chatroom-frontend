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
import { socket } from "../../socket/socket";

type Props = {
  groupedMessages: Record<string, GetAllMessage[]>;
  loginUser: loginResponse;
  onEditMessage: (id: string, text: string) => void;
  onPin: (id: number) => void;
  onDelete: (id: number) => void;
  onForward: (id: number, receiverIds: number[], groupIds: number[]) => void;
  chatroom_id: number
  messages: GetAllMessage[]
};

type SelectedItem = { type: "user" | "group"; id: number };

type ReactionResponse = {
  messageId: string;
  reactions: {
    userId: string;
    emoji: string;
    userName: string
  }[];
};

// Reaction choices
  const Reactions = [
    { icon: "❤️", label: "love" },
    { icon: "😂", label: "haha" },
    { icon: "👍", label: "like" },
    { icon: "😮", label: "wow" },
    { icon: "😢", label: "sad" },
    { icon: "😡", label: "angry" },
  ];
  const reactionIcons: Record<string, React.JSX.Element> = {
  love: <span>❤️</span>,
  haha: <span>😂</span>,
  like: <span>👍</span>,
  wow: <span>😮</span>,
  sad: <span>😢</span>,
  angry: <span>😡</span>,
};
export default function GroupMessages({
  groupedMessages,
  loginUser,
  onEditMessage,
  onPin,
  onDelete,
  onForward,
  chatroom_id,
  messages
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
  const loggedInUserId = Number(loginUser?.user?.id)

  const [isReacted, setIsReacted] = React.useState(false);
  const [emoji, setEmoji] = React.useState("");
  const [messageReactions, setMessageReactions] = React.useState(
    messages?.reactions || []
  );

  console.log("group data", messages)

  const { userListData } = userListQuery();

  const chatUsers: ChatUserType[] =
    userListData?.map((u: UserListResponse) => ({
      id: u.id,
      username: u.username,
      avatar_url: u.avatar_url,
      status: typeof u.status === "string" ? u.status : "",
    })) || [];

  const { groupChatListQuery: groupChatList = [] as GroupChatResponse[] } = useGroupChatList({ page: 1, pageSize: 15 });

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


  const renderReactions = () => {
   const reactions = messageReactions;
    if (!reactions || reactions.length === 0) return null;
    // Current user's reaction
    const myReaction = reactions.find((r: any) => r.userId === loggedInUserId);
    // Other reactions (excluding current user)
    const otherReactions = reactions.filter((r: any) => r.userId !== loggedInUserId);
    // Current user's reaction
    // const myReaction = reactions.find((r) => r?.userId === loggedInUserId);
    // // Other reactions (excluding current user)
    // const otherReactions = reactions.filter((r) => r.userId !== loggedInUserId);

    return (
      <div className="flex items-center gap-1 bg-gray-300 rounded-lg p-0.5">
        {/* Show my reaction if I reacted, else show default icon */}
        {myReaction && (
          <button className="bg-blue-400 rounded-full  p-0">
            {reactionIcons[myReaction?.react]}
          </button>
        )}

        {/* Show first other user's reaction if exists */}
        {otherReactions[0] && (
          <button disabled className="cursor-not-allowed pointer-none ">
            {reactionIcons[otherReactions[0].react]}
          </button>
        )}
      </div>
    );
  };

  const handleReactMessageUI = React.useCallback(
    (data: ReactionResponse) => {
          console.log("reaction group data", data)
          console.log("group message id", messages)
      if (data.messageId === String(groupedMessages.id)) {
        setMessageReactions(
          data?.reactions?.map((reaction) => ({
            userId: reaction.userId,
            userName: "", // Replace "" with the actual value if you have it
            react: reaction?.emoji, // Replace "" with the actual value if you have it
            reactions: [],
          })) || []
        );
        const myReaction = data.reactions?.find(
          (r) => Number(r.userId) === loggedInUserId
        );
        setIsReacted(!!myReaction);
        setEmoji(myReaction?.emoji || "");
      }
    },
    [groupedMessages.id, loggedInUserId]
  );

  React.useEffect(() => {
    socket.on("group-message-reacted", handleReactMessageUI);
    return () => {
      socket.off("grou[-message-reacted", handleReactMessageUI);
    };
  }, [groupedMessages.id]);

  const handleSendReaction = (messageId: string, react: string) => {
    try {
      // console.log("message id in react", messageId)
      if (isReacted && emoji === react) {
        socket.emit("group-message-unreact", { messageId: messageId });
        setIsReacted(false);
        setEmoji("");
      } else {
        socket.emit("group-message-react", {
          messageId: messageId,
          emoji: react,
          chatroomId: chatroom_id
        });
        setIsReacted(true);
        setEmoji(react);
      }
    } catch (error) {
      console.log("Error handling reaction");
    }
  };

  React.useEffect(() => {
    if (groupedMessages.reactions && groupedMessages.reactions.length > 0) {
      setIsReacted(true);
      setEmoji((groupedMessages.reactions[0] as { emoji: string })?.emoji);
    }
  }, [groupedMessages.reactions]);

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
            const isSelected = selectedMessageId === m?.id?.toString();

            return (
              <div
                key={m.id}
                className={`message-item flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"
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

                {isOwn && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition flex items-center gap-1"
                  >
                    {renderReactions()}
                  </button>
                )}
                {/* Message */}
                <div
                  className={`flex flex-col ${isOwn ? "items-end" : "items-start"
                    } gap-1`}
                >
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
                          {
                            m.forwarded_from_id && (
                              <p>Forward from {m.forwarded_from_id}</p>
                            )
                          }
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
                            onClick={() => handleSendReaction(String(m?.id), emoji?.label)}
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

                  {/* Receiver side reactions */}
                  {!isOwn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition flex items-center gap-1"
                    >
                      {renderReactions()}
                    </button>
                  )}

                  {/* Time display */}
                  {isSelected && (
                    <span
                      className={`text-[11px] mt-1 transition-opacity ${isOwn ? "text-slate-400 pr-1" : "text-slate-500 pl-1"
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
