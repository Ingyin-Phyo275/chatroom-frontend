// MessageList.tsx
import { useEffect } from "react";
import MessageItem from "./MessageItem";
import { groupMessagesByDay } from "@/utils/helper";
import type { PrivateChatMessage } from "@/dto/response/PrivateChatMessage";
import type { loginResponse } from "@/dto/response/LoginResponse";
import type { ChatUserType } from "@/dto/UserTypes";
import { formatMessageDate } from "../../hooks/helper";

export default function MessageList({
  messages,
  loginUser,
  user,
  onEdit,
  onDownload,
  setPreviewModal,
  chatContainerRef,
  setIsAtBottom,
  onDelete
}: {
  messages: PrivateChatMessage[];
  loginUser: loginResponse;
  user: ChatUserType;
  onEdit: (id: string, content: string) => void;
  onDownload: (url: string, filename: string) => void;
  setPreviewModal: (preview: any) => void;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  setIsAtBottom: (atBottom: boolean) => void;
  onDelete: (messageId: number) => void;
}) {
  // Track if user is at bottom
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const atBottom =
        container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      setIsAtBottom(atBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [chatContainerRef, setIsAtBottom]);

  const groupedMessages = groupMessagesByDay(messages);
  const sortedDays = Object.keys(groupedMessages).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const filePathFromUrl = (url?: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  };

  // const formatDayLabel = (day: string) => {
  //   const msgDate = new Date(day);
  //   const today = new Date();
  //   const yesterday = new Date();
  //   yesterday.setDate(today.getDate() - 1);

  //   if (
  //     msgDate.getFullYear() === today.getFullYear() &&
  //     msgDate.getMonth() === today.getMonth() &&
  //     msgDate.getDate() === today.getDate()
  //   ) return "Today";

  //   if (
  //     msgDate.getFullYear() === yesterday.getFullYear() &&
  //     msgDate.getMonth() === yesterday.getMonth() &&
  //     msgDate.getDate() === yesterday.getDate()
  //   ) return "Yesterday";

  //   // const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
  //   // if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  //   // if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  //   // if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  //   // return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`;
  //   return msgDate.toLocaleDateString([], {
  //   weekday: "long",
  //   month: "short",
  //   day: "numeric",
  //   year: msgDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  // });
  // };

  return (
    <div
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
    >
      {Object.keys(groupedMessages).length === 0 && (
        <div className="text-center text-sm text-slate-400 mt-6">
          No messages yet. Say hello
        </div>
      )}

      {sortedDays.map((day) => (
        <div key={day} className="space-y-3">
          <div className="flex justify-center">
            <span className="px-3 py-1 text-xs rounded-full bg-slate-300/70 dark:bg-slate-600/70">
              {formatMessageDate(day)}
            </span>
          </div>

          {groupedMessages[day].map((msg: PrivateChatMessage) => {
            const filePath = filePathFromUrl(msg.attachment_url ?? null);
            return (
              <MessageItem
                key={msg.id}
                message={msg}
                isOwn={
                  String(typeof msg.sender === "object" ? msg.sender.id : msg.sender) ===
                  String(loginUser.user.id)
                }
                filePath={filePath!}
                user={user}
                onEdit={onEdit}
                onDownload={onDownload}
                setPreviewModal={setPreviewModal}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
