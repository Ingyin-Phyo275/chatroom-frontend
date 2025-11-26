import * as React from "react";
import type { PrivateChatMessage } from "@/dto/response/PrivateChatMessage";
import type { ChatUserType } from "@/dto/UserTypes";
import type { UserListResponse } from "@/dto/response/UserListResponse";
import * as Avatar from "@radix-ui/react-avatar";
import {
  Angry,
  Heart,
  Smile,
  ThumbsUp,
} from "lucide-react";
import { socket } from "../../socket/socket";
import { userListQuery } from "../../composables/Queries/userListQuery";
import ForwardDialog from "./ForwardDialog";
import MessageBubble from "./MessageBubble";

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

  const [isReacted, setIsReacted] = React.useState(false);
  const [emoji, setEmoji] = React.useState("");

  const loginUser = JSON.parse(localStorage.getItem("user") || '{}') ;
  const loggedInUserId  = loginUser?.user?.id;

  const reactions = [
    { icon: <Smile className="w-7 h-7 hover:fill-yellow-500 hover:text-white hover:rounded-full" />, label: "smile" },
    { icon: <Heart className="w-7 h-7 hover:fill-green-500 hover:text-white hover:rounded-full" />, label: "love" },
    { icon: <ThumbsUp className="w-7 h-7 hover:fill-primary hover:text-white hover:rounded-full" />, label: "like" },
    { icon: <Angry className="w-7 h-7 hover:fill-red-500 hover:text-white hover:rounded-full" />, label: "angry" },
  ];

  const reactionIcons: Record<string, React.JSX.Element> = {
    smile: <Smile className="w-7 h-7 bg-gray-100 p-1 rounded-full stroke-white fill-yellow-500" />,
    love: <Heart className="w-7 h-7 bg-gray-100 p-1 rounded-full stroke-white fill-green-500" />,
    like: <ThumbsUp className="w-7 h-7 bg-gray-100 p-1 rounded-full stroke-white fill-primary" />,
    angry: <Angry className="w-7 h-7 bg-gray-100 p-1 rounded-full stroke-white fill-red-500" />,
  };

  React.useEffect(() => {
    const outgoing = (event: any, ...args: any[]) =>
      console.log("📤 Outgoing event:", event, "Payload:", args);

    const incoming = (event: any, ...args: any[]) =>
      console.log("📥 Incoming event:", event, "Payload:", args);

    socket.onAnyOutgoing(outgoing);
    socket.onAny(incoming);

    return () => {
      socket.offAnyOutgoing(outgoing);
      socket.offAny(incoming);
    };
  }, []);

  React.useEffect(() => {
    if (showForwardDialog) setSelectedUsers([]);
  }, [showForwardDialog]);

  React.useEffect(() => {
    if (message.reactions && message.reactions.length > 0) {
      setIsReacted(true);
      setEmoji(message.reactions[0].react);
    }
  }, [message.reactions]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".message-item")) {
        setActiveReactionMessageId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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

  const handleReactMessageUI = React.useCallback(
    (data: ReactionResponse) => {
      if (data.messageId === message.id && data.reactions?.length > 0) {
        setIsReacted(true);
        setEmoji(data.reactions[0].emoji);
      } else if (data.messageId === message.id) {
        setIsReacted(false);
        setEmoji("");
      }
    },
    [message.id]
  );

  React.useEffect(() => {
    socket.on("private-message-reacted", handleReactMessageUI);
    return () => {socket.off("private-message-reacted", handleReactMessageUI)};
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
    const reactions = message.reactions || [];
    const count = reactions.length;

    const myReaction = reactions.find(r => r.userId == loggedInUserId);
    const otherReaction = reactions.find(r => r.userId != loggedInUserId);

    // No reactions
    if (count === 0) {
      return (
        <Heart className="w-5 h-5 bg-gray-200 p-1 rounded-full text-primary" />
      );
    }

    // One reaction
    if (count === 1) {
      if (myReaction) {
        return (
          <div className="flex items-center gap-1">
            {reactionIcons[myReaction.react]}
            {!isOwn && (
              <Heart className="w-5 h-5 bg-gray-200 opacity-60 p-1 rounded-full text-primary" />
            )}
          </div>
        );
      }

      if (otherReaction) {
        return (
          <div className="flex items-center gap-1">
            {reactionIcons[otherReaction.react]}
            {!isOwn && (
              <Heart className="w-5 h-5 bg-gray-200 opacity-60 p-1 rounded-full text-primary" />
            )}
          </div>
        );
      }
    }

    // Both reacted
    return (
      <div className="flex items-center gap-1">
        {myReaction && (
          <button className="bg-primary rounded-full p-0">{reactionIcons[myReaction.react]}</button>
        )}
        {otherReaction && (
          <button disabled className="opacity-60 pointer-none">{reactionIcons[otherReaction.react]}</button>
        )}
      </div>
    );
  };

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
        className={`relative message-item flex flex-col ${
          isOwn ? "items-end" : "items-start"
        } gap-1`}
        data-id={message.id}
      >
        <div className="relative flex items-center gap-1">

          {/* Sender side reactions */}
          {isOwn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveReactionMessageId(isReactionActive ? null : message.id);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition flex items-center gap-1"
            >
              {renderReactions()}
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
          />

          {/* Receiver side reactions */}
          {!isOwn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveReactionMessageId(isReactionActive ? null : message.id);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition flex items-center gap-1"
            >
              {renderReactions()}
            </button>
          )}

          {/* Reaction bar */}
          {isReactionActive && (
            <div
              className={`absolute -top-12 z-10 flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg transition-transform duration-200 ease-out ${
                isOwn ? "right-0" : "left-0"
              }`}
            >
              {reactions.map((reaction) => (
                <button
                  key={reaction.label}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  onClick={() => handleSendReaction(reaction.label)}
                >
                  {reaction.icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {showTime && (
          <span
            className={`text-[11px] mt-1 ${
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
