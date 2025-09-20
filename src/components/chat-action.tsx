import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatUserType } from "@/dto/UserTypes";
import { EllipsisVertical } from "lucide-react";
interface ChatActionProps {
    user: ChatUserType
}
export default function ChatAction({user}: ChatActionProps) {
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()} // prevent row click when opening dropdown
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            <EllipsisVertical className="w-4 h-4 text-gray-500" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-40">
          <DropdownMenuItem onClick={() => alert(`Pin chat: ${user.username}`)}>
            Pin chat
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => alert(`Delete chat: ${user.username}`)}
          >
            Delete chat
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => alert(`Archive chat: ${user.username}`)}
          >
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
