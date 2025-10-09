import { CheckCheck, Pin, Trash, Pen } from "lucide-react";
import * as Avatar from "@radix-ui/react-avatar";
import type { GetAllMessage } from "../../dto/response/GetAllMessage";
import AttachmentPreview from "./AttachmentPreview";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

type Props = {
  message: GetAllMessage;
  isOwn: boolean;
  loginUser: any;
  setMessages: React.Dispatch<React.SetStateAction<GetAllMessage[]>>;
  handleEditMessage?: (id: string, text: string) => void;
};

export default function MessageItem({ message: m, isOwn, loginUser, setMessages, handleEditMessage }: Props) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-3`}>
      {!isOwn && (
        <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
          <Avatar.Image
            src={(m.sender as any)?.avatar || undefined}
            alt={m.sender?.username || "User"}
            className="w-full h-full rounded-full object-cover"
          />
          <Avatar.Fallback className="w-full h-full rounded-full flex items-center justify-center bg-gray-500 text-white font-semibold">
            {m.sender?.username ? m.sender.username.slice(0, 2).toUpperCase() : "U"}
          </Avatar.Fallback>
        </Avatar.Root>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={`max-w-[70%] p-2 rounded-lg cursor-pointer ${isOwn ? "bg-primary text-white" : "bg-slate-200 text-slate-900"}`}>
            <div>
              {m.content && <p className="mb-1">{m.content}</p>}
              {m.attachment_url && <AttachmentPreview url={m.attachment_url} />}
            </div>
            <div className="text-xs text-slate-300 mt-1 flex justify-between">
              <span>{new Date(m.created_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              {isOwn && m.is_delivered && <CheckCheck className="w-3 h-3 text-white" />}
            </div>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="flex flex-row gap-3 mr-3" side="top">
          <DropdownMenuItem onClick={() => alert(`Pin message: ${m.id}`)}>
            <Pin className="w-4 h-4 mr-2" /> Pin
          </DropdownMenuItem>

          {isOwn && handleEditMessage && (
            <DropdownMenuItem onClick={() => handleEditMessage(String(m.id), m.content || "")}>
              <Pen className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
          )}

          {isOwn && (
            <DropdownMenuItem onClick={() => alert(`Delete message: ${m.id}`)}>
              <Trash className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
