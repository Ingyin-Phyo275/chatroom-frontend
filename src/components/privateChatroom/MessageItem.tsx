import * as React from "react";
import type { PrivateChatMessage } from "@/dto/response/PrivateChatMessage";
import type { ChatUserType } from "@/dto/UserTypes";
import type { UserListResponse } from "@/dto/response/UserListResponse";
import * as Avatar from "@radix-ui/react-avatar";
import { socket } from "../../socket/socket";
import { userListQuery } from "../../composables/Queries/userListQuery";
import ForwardDialog from "./ForwardDialog";
import MessageBubble from "./MessageBubble";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "../ui/separator";

type ReactionResponse = {
  messageId: string;
  reactions: {
    userId: string;
    emoji: string;
  }[];
};

export default function MessageItem({
  message,
  isOwn,
  user,
  filePath,
  onEdit,
  setPreviewModal,
  onDelete,
  onPin,
  onForward,
  activeReactionMessageId,
  setActiveReactionMessageId,
}: {
  message: PrivateChatMessage;
  isOwn: boolean;
  user: ChatUserType;
  filePath: string;
  onEdit: (id: string, content: string) => void;
  setPreviewModal: (preview: any) => void;
  onDelete: (messageId: number, is_everyone: boolean) => void;
  onPin: (messageId: number) => void;
  onForward: (messageId: number, receiverIds: number[]) => void;
  activeReactionMessageId: string | null;
  setActiveReactionMessageId: (id: string | null) => void;
}) {
  const sender = user;

  const [showTime, setShowTime] = React.useState(false);
  const [showForwardDialog, setShowForwardDialog] = React.useState(false);
  const [forwardMessageId, setForwardMessageId] = React.useState<number | null>(
    null
  );
  const [selectedUsers, setSelectedUsers] = React.useState<number[]>([]);

  const toggleTime = () => setShowTime((prev) => !prev);

  const isReactionActive = activeReactionMessageId === message.id;

  const loginUser = JSON.parse(localStorage.getItem("user") || "{}");
  const loggedInUserId = loginUser?.user?.id;
  const [messageReactions, setMessageReactions] = React.useState(
    message.reactions || []
  );

  const [isReacted, setIsReacted] = React.useState(false);
  const [emoji, setEmoji] = React.useState("");

  const reactionIcons: Record<string, React.JSX.Element> = {
    love: <span>❤️</span>,
    haha: <span>😂</span>,
    like: <span>👍</span>,
    wow: <span>😮</span>,
    sad: <span>😢</span>,
    angry: <span>😡</span>,
  };
  // React.useEffect(() => {
  //   const outgoing = (event: any, ...args: any[]) =>
  //     console.log("📤 Outgoing event:", event, "Payload:", args);

  //   const incoming = (event: any, ...args: any[]) =>
  //     console.log("📥 Incoming event:", event, "Payload:", args);

  //   socket.onAnyOutgoing(outgoing);
  //   socket.onAny(incoming);

  //   return () => {
  //     socket.offAnyOutgoing(outgoing);
  //     socket.offAny(incoming);
  //   };
  // }, []);

  React.useEffect(() => {
    if (showForwardDialog) setSelectedUsers([]);
  }, [showForwardDialog]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".message-item")) {
        setActiveReactionMessageId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleReactMessageUI = React.useCallback(
    (data: ReactionResponse) => {
      if (data.messageId === message.id) {
        setMessageReactions(
          data?.reactions?.map((reaction) => ({
            ...reaction,
            react: reaction.emoji, // Assuming 'emoji' is the value for 'react'
          })) || []
        );
        const myReaction = data.reactions?.find(
          (r) => r.userId === loggedInUserId
        );
        setIsReacted(!!myReaction);
        setEmoji(myReaction?.emoji || "");
      }
    },
    [message.id, loggedInUserId]
  );

  React.useEffect(() => {
    socket.on("private-message-reacted", handleReactMessageUI);
    return () => {
      socket.off("private-message-reacted", handleReactMessageUI);
    };
  }, [message.id]);

  const { userListData } = userListQuery();

  const chatUsers: ChatUserType[] =
    userListData?.map((u: UserListResponse) => ({
      id: u.id,
      username: u.username,
      avatar_url: u.avatar_url,
      status: typeof u.status === "string" ? u.status : "",
    })) || [];

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };
  const renderReactions = () => {
    const reactions = messageReactions;
    if (!reactions || reactions.length === 0) return null;
    // Current user's reaction
    const myReaction = reactions.find((r) => r.userId === loggedInUserId);
    // Other reactions (excluding current user)
    const otherReactions = reactions.filter((r) => r.userId !== loggedInUserId);

    return (
      <div className="flex items-center gap-1 bg-gray-300 rounded-lg p-0.5">
        {/* Show my reaction if I reacted, else show default icon */}
        {myReaction && (
          <button className="bg-blue-400 rounded-full  p-0">
            {reactionIcons[myReaction.react]}
          </button>
        )}

        {/* Show first other user's reaction if exists */}
        {otherReactions[0] && (
          <button  className="">
            {reactionIcons[otherReactions[0].react]}
          </button>
        )}
      </div>
    );
  };
  const handleSendReaction = (react: string) => {
    try {
      if (isReacted && emoji === react) {
        socket.emit("private-message-unreact", { messageId: message?.id });
        setIsReacted(false);
        setEmoji("");
      } else {
        socket.emit("private-message-react", {
          messageId: message?.id,
          emoji: react,
        });
        setIsReacted(true);
        setEmoji(react);
      }
      setActiveReactionMessageId(null);
    } catch (error) {
      console.log("Error handling reaction");
    }
  };

  React.useEffect(() => {
    if (message.reactions && message.reactions.length > 0) {
      setIsReacted(true);
      setEmoji(message.reactions[0].react);
    }
  }, [message.reactions]);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-3`}>
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

      <div
        className={`relative message-item flex flex-col ${isOwn ? "items-end" : "items-start"
          } gap-1`}
        data-id={message.id}
      >
        <div className="relative flex items-center gap-1">
          {/* Sender side reactions */}
          {isOwn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveReactionMessageId(
                  isReactionActive ? null : message.id
                );
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition flex items-center gap-1"
            >
              <Dialog>
                <DialogTrigger>{renderReactions()}</DialogTrigger>
                <DialogContent className="max-w-sm w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-start">Reactions</DialogTitle>
                    <Separator/>
                    <DialogDescription>
                    </DialogDescription>
                    {
                      messageReactions?.map((r) => (
                        <>
                          <div className="flex flex-row justify-between items-center gap-1">
                          <p className="text-black">{r?.userName} {r?.userId === loggedInUserId && "(You)"}</p>
                          <p>{reactionIcons[r.react]}</p>
                        </div>
                        </>
                      ))
                    }
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </button>
          )}

          <MessageBubble
            message={message}
            isOwn={isOwn}
            toggleTime={toggleTime}
            filePath={filePath}
            setPreviewModal={setPreviewModal}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
            setForwardMessageId={setForwardMessageId}
            setShowForwardDialog={setShowForwardDialog}
            setIsReacted={setIsReacted}
            setEmoji={setEmoji}
            handleSendReaction={handleSendReaction}
          />

          {/* Receiver side reactions */}
          {!isOwn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveReactionMessageId(
                  isReactionActive ? null : message.id
                );
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition flex items-center gap-1"
            >
              <Dialog>
                <DialogTrigger>{renderReactions()}</DialogTrigger>
                <DialogContent className="max-w-sm w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-start">Reactions</DialogTitle>
                    <Separator/>
                    <DialogDescription>
                    </DialogDescription>
                    {
                      messageReactions?.map((r) => (
                        <>
                          <div className="flex flex-row justify-between items-center gap-1">
                          <p className="text-black">{r?.userName} {r?.userId === loggedInUserId && "(You)"}</p>
                          <p>{reactionIcons[r.react]}</p>
                        </div>
                        </>
                      ))
                    }
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </button>
          )}
        </div>

        {showTime && (
          <span
            className={`text-[11px] mt-1 ${isOwn ? "text-slate-400 pr-2" : "text-slate-500 pl-2"
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

      {showForwardDialog && forwardMessageId !== null && (
        <ForwardDialog
          open={showForwardDialog}
          onClose={() => setShowForwardDialog(false)}
          chatUsers={chatUsers}
          selectedUsers={selectedUsers}
          toggleUserSelection={toggleUserSelection}
          sendForward={onForward}
          messageId={forwardMessageId}
        />
      )}
    </div>
  );
}
