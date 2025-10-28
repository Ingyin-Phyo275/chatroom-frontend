import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatUserType } from "@/dto/UserTypes";
import { Archive, EllipsisVertical, Pin, Trash } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "../socket/socket";
import { useEffect } from "react";
interface ChatActionProps {
    user: ChatUserType
    onSelectUser: (user: ChatUserType) => void;
}

export default function ChatAction({user, onSelectUser}: ChatActionProps) {
  const queryClient = useQueryClient();
  const loginUser = JSON.parse(localStorage.getItem('user')!);
  const handleDelete = async () => {
    try{
      socket.emit("delete-private-chat", {receiver_id: user?.id});
    }catch(error){
      toast.error("Error while deleting chat!");
    }
  }

  useEffect( () => {
    socket.on("private-chat-deleted", () => {
      queryClient.invalidateQueries({ queryKey: ["chatUserList"] });
      //@ts-ignore
      onSelectUser(null);
    })
  },[])
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
            onClick={(e) => {
              e.stopPropagation();
              handleDelete()
            }
            }
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
