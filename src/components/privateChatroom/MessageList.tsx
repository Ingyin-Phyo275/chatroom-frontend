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
  //@ts-ignore
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

// console.log("private message list", messages)
  return (
    <div
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 "
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
            // console.log("filePath", filePath);
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
