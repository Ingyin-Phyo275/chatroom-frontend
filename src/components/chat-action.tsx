import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatUserType } from "@/dto/UserTypes";
import { Archive, EllipsisVertical, Pin, Trash } from "lucide-react";
import { toast } from "sonner";
import { deleteChat } from "../http/api/deleteChat";
import { useQueryClient } from "@tanstack/react-query";
interface ChatActionProps {
    user: ChatUserType
}
export default function ChatAction({user}: ChatActionProps) {
  const queryClient = useQueryClient();
  const loginUser = JSON.parse(localStorage.getItem('user')!);
  const handleDelete = async () => {
    try{
      const chatId = user?.id;
      const response = await deleteChat({chatId});
      queryClient.invalidateQueries({ queryKey: ["groupChatList"] });
      console.log("response", response);
    }catch(error){
      toast.error("Error while deleting chat!");
    }
  }
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
          <DropdownMenuItem onClick={() => alert(`Pin chat: ${user.id}- ${loginUser.user.id}`)}>
           <Pin className="w-4 h-4 mr-2" /> Pin 
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDelete()}
          >
            <Trash className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => alert(`Archive chat: ${user.username}`)}
          >
            <Archive className="w-4 h-4 mr-2" /> Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
