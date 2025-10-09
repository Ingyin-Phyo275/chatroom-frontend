import type { GetAllMessage } from "../../dto/response/GetAllMessage";
import { formatMessageDate } from "../../hooks/helper";
import MessageItem from "./MessageItem";

type Props = {
  messages: GetAllMessage[];
  loginUser: any;
  listRef: React.RefObject<HTMLDivElement>;
  setMessages: React.Dispatch<React.SetStateAction<GetAllMessage[]>>;
  handleEditMessage?: (id: string, text: string) => void;
};

export default function MessageList({ messages, loginUser, listRef, setMessages, handleEditMessage }: Props) {
  const groupedMessages: Record<string, GetAllMessage[]> = messages.reduce(
    (groups: Record<string, GetAllMessage[]>, msg) => {
      if (!msg.created_at) return groups;
      const dayKey = new Date(msg.created_at).toDateString();
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(msg);
      return groups;
    },
    {}
  );

  return (
    <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
      {Object.keys(groupedMessages).map((dayKey) => (
        <div key={dayKey} className="space-y-3">
          <div className="flex justify-center">
            <span className="px-3 py-1 text-xs rounded-full bg-slate-300/70 dark:bg-slate-600/70">
              {formatMessageDate(dayKey)}
            </span>
          </div>
          {groupedMessages[dayKey].map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isOwn={msg.sender?.id === loginUser.user.id}
              loginUser={loginUser}
              setMessages={setMessages}
              handleEditMessage={handleEditMessage}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
