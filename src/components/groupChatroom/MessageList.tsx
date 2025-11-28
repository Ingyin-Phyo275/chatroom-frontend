import * as React from "react";
import * as Avatar from "@radix-ui/react-avatar";
import { formatMessageDate } from "../../hooks/helper";
import type { GetAllMessage } from "../../dto/response/GetAllMessage";
import type { loginResponse } from "../../dto/response/LoginResponse";
import { userListQuery } from "../../composables/Queries/userListQuery";
import type { ChatUserType } from "../../dto/UserTypes";
import type { UserListResponse } from "../../dto/response/UserListResponse";
import ForwardDialog from "./ForwardDialog";
import { useGroupChatList } from "../../composables/Queries/useGroupChatList";
import type { GroupChatResponse } from "../../dto/response/ChatRoom";
import { socket } from "../../socket/socket";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "../ui/separator";
import MessageBubble from "./MessageBubble";

type Props = {
  groupedMessages: Record<string, GetAllMessage[]>;
  loginUser: loginResponse;
  onEditMessage: (id: string, text: string) => void;
  onPin: (id: number) => void;
  onDelete: (id: number) => void;
  onForward: (id: number, receiverIds: number[], groupIds: number[]) => void;
  chatroom_id: number;
  messages: GetAllMessage[];
};

type SelectedItem = { type: "user" | "group"; id: number };

type ReactionResponse = {
  messageId: string;
  reactions: {
    userId: string;
    emoji: string;
    userName: string;
  }[];
};


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
  messages,
}: Props) {
  const [selectedMessageId, setSelectedMessageId] = React.useState<
    string | null
  >(null);
  const handleToggleTime = (id: string) => {
    setSelectedMessageId((prev) => (prev === id ? null : id));
  };

  const [reactionMap, setReactionMap] = React.useState<Record<string, any[]>>(
    {}
  );

  const [showForwardDialog, setShowForwardDialog] = React.useState(false);
  const [forwardMessageId, setForwardMessageId] = React.useState<number | null>(
    null
  );
  const loggedInUserId = Number(loginUser?.user?.id);

  //@ts-ignore
  const [isReacted, setIsReacted] = React.useState(false);
  //@ts-ignore
  const [emoji, setEmoji] = React.useState("");

  console.log("group data", messages);

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

  const renderReactions = (m: GetAllMessage) => {
    const reactions = reactionMap[m?.id] || [];

    console.log("reaction data from api", reactionMap)
    if (reactions.length === 0) return null;
    const myReaction = reactions.find(
      (r: any) => Number(r.userId) === loggedInUserId
    );
    const otherReactions = reactions.filter(
      (r: any) => Number(r.userId) !== loggedInUserId
    );

    return (
      <div className="flex items-center gap-1 bg-gray-300 rounded-lg p-0.5">
        {myReaction && (
          <button className="bg-blue-400 rounded-full p-0">
            {reactionIcons[myReaction.emoji]}
          </button>
        )}

        {otherReactions[0] && (
          <button>{reactionIcons[otherReactions[0].emoji]}</button>
        )}
      </div>
    );
  };

  const handleReactMessageUI = React.useCallback((data: ReactionResponse) => {
    setReactionMap((prev) => ({
      ...prev,
      [data.messageId]: data.reactions,
    }));
  }, []);

  React.useEffect(() => {
    socket.on("group-message-reacted", handleReactMessageUI);
    return () => {
      socket.off("group-message-reacted", handleReactMessageUI);
    };
  }, []);

  const handleSendReaction = (messageId: string, react: string) => {
    const existing = reactionMap[messageId] || [];
    const myExisting = existing.find(
      (r) => Number(r.userId) === loggedInUserId
    );

    //  If user already reacted with same emoji - UNREACT
    if (myExisting && myExisting.emoji === react) {
      socket.emit("group-message-unreact", {
        messageId,
        chatroomId: chatroom_id,
      });

      // update UI
      setReactionMap((prev) => ({
        ...prev,
        [messageId]: existing.filter(
          (r) => Number(r.userId) !== loggedInUserId
        ),
      }));

      return;
    }

    //  Otherwise - send new reaction
    socket.emit("group-message-react", {
      messageId,
      emoji: react,
      chatroomId: chatroom_id,
    });

    // update UI
    setReactionMap((prev) => ({
      ...prev,
      [messageId]: [
        ...existing.filter((r) => Number(r.userId) !== loggedInUserId),
        { userId: loggedInUserId, emoji: react },
      ],
    }));
  };

  React.useEffect(() => {
  const map: Record<string, any[]> = {};

  messages.forEach((msg) => {
    if (msg.reactions && msg.reactions.length > 0) {
      map[msg.id] = msg.reactions.map((r) => ({
        userId: r.userId,
        emoji: r.react,
        userName: r.userName,
      }));
    }
  });

  setReactionMap(map);
}, [messages]);

  React.useEffect(() => {
    const reactions = messages.flatMap((msg) => msg.reactions || []);
    console.log("reaction in useEffect", reactions)
    if (reactions.length > 0) {
      setIsReacted(true);
      setEmoji(reactions[0].react);
    }
  }, [messages]);

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
                <div className="flex flex-row gap-1">
                  {/* reaction for sender side */}
                  {isOwn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1  dark:hover:bg-gray-700 rounded-full transition flex items-center gap-1"
                    >
                      <Dialog>
                        <DialogTrigger>{renderReactions(m)}</DialogTrigger>
                        <DialogContent className="max-w-sm w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-start">
                              Reactions
                            </DialogTitle>
                            <Separator />
                            <DialogDescription></DialogDescription>
                            {reactionMap[m.id]?.map((r) => (
                              <>
                                <div className="flex flex-row justify-between items-center gap-1">
                                  <p className="text-black dark:text-white">
                                    {r?.userName ? r?.userName : r?.userId}{" "}
                                    {r?.userId === loggedInUserId &&
                                      `(Me)`}
                                  </p>
                                  <p>{reactionIcons[r.emoji]}</p>
                                </div>
                              </>
                            ))}
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    </button>
                  )}
                  {/* Message */}
                  <div
                    className={`flex flex-col ${
                      isOwn ? "items-end" : "items-start"
                    } gap-1`}
                  >
                      <MessageBubble
                        m={m}
                        isOwn={isOwn}
                        handleToggleTime={handleToggleTime}
                        onEditMessage={onEditMessage}
                        onPin={onPin}
                        onDelete={onDelete}
                        onForward={onForward}
                        handleSendReaction={handleSendReaction}
                        setForwardMessageId={setForwardMessageId}
                        setShowForwardDialog={setShowForwardDialog}
                      />

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

                  {/* Receiver side reactions */}
                  {!isOwn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1 dark:hover:bg-gray-700 rounded-full transition flex items-center gap-1"
                    >
                      <Dialog>
                        <DialogTrigger>{renderReactions(m)}</DialogTrigger>
                        <DialogContent className="max-w-sm w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-start">
                              Reactions
                            </DialogTitle>
                            <Separator />
                            <DialogDescription></DialogDescription>
                            {reactionMap[m?.id]?.map((r) => (
                              <>
                                <div className="flex flex-row justify-between items-center gap-1">
                                  <p className="text-black dark:text-white">
                                    {r?.userName ? r?.userName : r?.userId}{" "}
                                    {r?.userId === loggedInUserId && "(Me)"}
                                  </p>
                                  <p>{reactionIcons[r.emoji]}</p>
                                </div>
                              </>
                            ))}
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    </button>
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
