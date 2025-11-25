import * as React from "react";
import type { PrivateChatMessage } from "@/dto/response/PrivateChatMessage";
import type { ChatUserType } from "@/dto/UserTypes";
import type { UserListResponse } from "@/dto/response/UserListResponse";
import * as Avatar from "@radix-ui/react-avatar";
import { Angry, CornerUpLeft, File, Heart, Pen, Pin, Smile, ThumbsUp, Trash } from "lucide-react";
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
import { socket } from "../../socket/socket";
import { userListQuery } from "../../composables/Queries/userListQuery";

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
  const [forwardMessageId, setForwardMessageId] = React.useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = React.useState<number[]>([]);

  const toggleTime = () => setShowTime((prev) => !prev);
  const isReactionActive = activeReactionMessageId === message.id;

  const [isReacted, setIsReacted] = React.useState(false);
  const [emoji, setEmoji] = React.useState("");

  const reactions = [
    { icon: <Smile className="w-7 h-7 hover:bg-yellow-500 hover:text-white hover:rounded-full" />, label: "smile" },
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
    if (message.reactions && message.reactions.length > 0) {
      // For simplicity, show the first reaction
      setIsReacted(true);
      setEmoji(message.reactions[0].react); // or emoji field if it's different
    }
  }, [message.reactions]);


  //console.log("message with reactions", message)

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
        // Remove reaction
        socket.emit("private-message-unreact", { messageId: message?.id });
        setIsReacted(false);
        setEmoji("");
      } else {
        // Add/Update reaction
        socket.emit("private-message-react", { messageId: message?.id, emoji: react });
        setIsReacted(true);
        setEmoji(react);
      }
      // Auto-close reaction bar
      setActiveReactionMessageId(null);

    } catch (error) {
      console.log("Error handling reaction");
    }
  };

  const handleReactMessageUI = (data: ReactionResponse) => {
    if (data.messageId === message.id && data.reactions?.length > 0) {
      setIsReacted(true);
      setEmoji(data.reactions[0].emoji); // update to first reaction or merge logic
    } else if (data.messageId === message.id && data.reactions.length === 0) {
      // No reactions left
      setIsReacted(false);
      setEmoji("");
    }
  };

  React.useEffect(() => {
    socket.on("private-message-reacted", handleReactMessageUI);
    return () => { socket.off("private-message-reacted", handleReactMessageUI) };
  }, [message.id]);



  React.useEffect(() => {
    socket.on("private-message-reacted", handleReactMessageUI);

    return () => {
      socket.off("private-message-reacted", handleReactMessageUI);
    };
  }, [handleReactMessageUI]);

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
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const sendForward = () => {
    if (forwardMessageId && selectedUsers.length > 0) {
      onForward(forwardMessageId, selectedUsers);
      setShowForwardDialog(false);
      setSelectedUsers([]);
    }
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
        className={`relative message-item flex flex-col ${isOwn ? "items-end" : "items-start"} gap-1`}
        data-id={message.id}
        data-sender-id={typeof message.sender === "object" ? message.sender.id : message.sender}
      >
        <div className="relative flex items-center gap-1">
          {isOwn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveReactionMessageId(isReactionActive ? null : message.id);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
            >
              {/* Show reacted emoji OR default heart */}
              {isReacted && reactionIcons[emoji] ? (
                reactionIcons[emoji]
              ) : (
                <Heart className="w-5 h-5 bg-gray-200 p-1 rounded-full text-primary" />
              )}
            </button>
          )}

          <div
            onClick={toggleTime}
            className={`max-w-[100%] p-2 rounded-lg cursor-pointer transition ${isOwn
              ? "bg-primary text-white rounded-br-none hover:bg-primary/90"
              : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none hover:bg-slate-300/80"
              }`}
          >
            <ContextMenu>
              <ContextMenuTrigger>
                {message?.content}

                {message.duration && (
                  <p className={`text-xs ${isOwn ? "text-slate-200" : "text-slate-400"}`}>
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
                        onClick={() => setPreviewModal({ type: "image", url: message.attachment_url })}
                      />
                    )}

                    {filePath?.match(/\.(mp4|webm)$/i) && (
                      <video src={message.attachment_url} controls className="max-w-full max-h-60 rounded-lg" />
                    )}

                    {filePath?.match(/\.(mp3|wav)$/i) && <audio controls src={message.attachment_url} />}

                    {!filePath?.match(/\.(jpeg|jpg|png|gif|mp4|webm|mp3|wav)$/i) && (
                      <div className="relative flex flex-col items-center justify-center w-[200px] h-[200px] bg-gray-100 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                        <File
                          className="w-12 h-12 text-slate-500 mb-2"
                          onClick={() => setPreviewModal({ type: "file", url: message.attachment_url })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </ContextMenuTrigger>

              <div className="flex justify-between items-center mt-1 text-xs text-slate-300 gap-2">
                {message?.is_edit && <span className="text-grey-500 italic">Edited</span>}
                {isOwn && (
                  <span className="ml-2 flex items-center gap-1">
                    {message?.is_delivered && !message?.isRead && (
                      <span className="italic text-slate-300">Delivered</span>
                    )}
                    {message?.isRead && <span className="italic text-slate-300">Seen</span>}
                  </span>
                )}
              </div>

              <ContextMenuContent>
                {isOwn && !filePath?.match(/\.(jpeg|jpg|png|gif|mp4|webm|mp3|wav)$/i) && (
                  <ContextMenuItem onClick={() => onEdit(message.id, message.content || "")}>
                    <Pen className="w-4 h-4 mr-2" /> Edit
                  </ContextMenuItem>
                )}

                {isOwn && (
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>
                      <Trash className="w-4 h-4 mr-auto" /> Delete
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-44">
                      <ContextMenuItem onClick={() => onDelete(Number(message.id), false)}>
                        Delete For Me
                      </ContextMenuItem>
                      <DropdownMenuSeparator />
                      <ContextMenuItem onClick={() => onDelete(Number(message.id), true)}>
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

          {!isOwn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveReactionMessageId(isReactionActive ? null : message.id);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition flex gap-1 items-center"
            >
              {/* Your own reaction or default */}
              {isReacted && reactionIcons[emoji] ? (
                reactionIcons[emoji]
              ) : (
                <Heart className="w-5 h-5 bg-gray-200 p-1 rounded-full text-primary" />
              )}

              {/* Show other reactions (except current user) */}
              {message.reactions?.filter(r => r.userId !== user.id).map((r, idx) => (
                <span key={idx}>
                  {reactionIcons[r.react]}
                </span>
              ))}
            </button>

          )}

          {isReactionActive && (
            <div
              className={`absolute -top-12 z-10 flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg transition-transform duration-200 ease-out scale-100 animate-scale-in ${isOwn ? "right-0" : "left-0"
                }`}
            >
              {reactions.map((reaction) => (
                <button
                  key={reaction.label}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
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
            className={`text-[11px] mt-1 transition-opacity ${isOwn ? "text-slate-400 pr-2" : "text-slate-500 pl-2"
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

      {/* Forward Dialog */}
      {showForwardDialog && forwardMessageId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-96">
            <h2 className="text-lg font-semibold mb-2">Select users to forward</h2>
            <ul className="max-h-64 overflow-y-auto">
              {chatUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <div className="flex items-center gap-3">
                    <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                      <Avatar.Image
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                      <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-500 text-white text-xs font-semibold">
                        {user.username.slice(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>

                    <span className="text-sm">{user.username}</span>
                  </div>

                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(Number(user.id))}
                    onChange={() => toggleUserSelection(Number(user.id))}
                    className="w-5 h-5"
                  />
                </li>
              ))}
            </ul>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
                onClick={() => setShowForwardDialog(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
                disabled={selectedUsers.length === 0}
                onClick={sendForward}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
