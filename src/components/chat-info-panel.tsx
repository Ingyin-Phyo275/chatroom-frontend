import {  useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Bell, Contact, CirclePlus } from "lucide-react";
import ChatMembersCard from "./InfoPanel/chat-member-card";
import * as Avatar from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MemberAddForm from "./member-add-form";
import { Dialog, DialogClose, DialogContent, DialogHeader } from "./ui/dialog";
import type { loginResponse } from "../dto/response/LoginResponse";
import type { UserListResponse } from "../dto/response/UserListResponse";
import type { ChatroomDetails } from "../dto/response/ChatroomDetails";
import { useChatroomDetails } from "../composables/Queries/useChatroomDetails";
import { DialogTitle } from "@radix-ui/react-dialog";
import ChatInfoViewMedia from "./InfoPanel/chat-info-viewMedia";
import { ScrollArea } from "./ui/scroll-area";

interface ChatInfoProps {
  selectedUser: loginResponse | UserListResponse | any;
}
export default function ChatInfoPanel({ selectedUser }: ChatInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatroom, setChatroom] = useState<ChatroomDetails | null>(null);
  const page = 1;
  const pageSize = 10;
  const isGroup = selectedUser?.is_group === true || selectedUser?.is_group === "true";

const { data, error, isLoading } = useChatroomDetails({
  chatroomId: isGroup ? selectedUser?.id : undefined,
  page,
  pageSize
});
  //console.log("ChatInfoPanel query key:", ["chatroomDetails", selectedUser?.id]);

  useEffect(() => {
    if (data) {
      setChatroom(data);
    }
  }, [data]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to fetch chatroom details</div>;
  const members: any = chatroom?.members ?? [];
  const messages: any = chatroom?.messages ?? [];
  //console.log("check chatroom messages", messages)
  // console.log("check group or not", selectedUser)
  return (
    <>
      <div className="flex flex-col items-center">
        <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
          {selectedUser?.avatar_url ? (
            <Avatar.Image
              src={selectedUser.avatar_url}
              alt={selectedUser.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Avatar.Fallback className="w-full h-full rounded-full flex items-center justify-center bg-gray-500 text-white font-semibold">
              {selectedUser?.username?.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          )}
        </Avatar.Root>
        <p className="font-medium mt-2">{selectedUser?.username}</p>
        <div className="flex flex-row gap-4 mt-4">
          {isGroup  ? (
            <div className="flex flex-col items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      className="rounded-full"
                      size="icon"
                    >
                      <CirclePlus className="w-4 h-4" />
                    </Button>
                    <p className="text-xs text-center mt-1">Add</p>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsOpen(true)}>
                    Add Members
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-auto rounded-lg p-6 bg-white">
                  <DialogHeader title="Add Members" />
                  <DialogTitle></DialogTitle>
                  <div className="mt-4">
                    <MemberAddForm
                      action="add"
                      chatroomId={selectedUser?.id}
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <DialogClose className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">
                      Close
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                className="rounded-full"
                size="icon"
                onClick={() => alert("Profile")}
              >
                <Contact className="w-4 h-4" />
              </Button>
              <p className="text-xs text-center mt-1">Profile</p>
            </div>
          )}

          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              className="rounded-full"
              size="icon"
              onClick={() => alert("Muted")}
            >
              <Bell className="w-4 h-4" />
            </Button>
            <p className="text-xs text-center mt-1">Mute</p>
          </div>
        </div>
      </div>

{/* <ScrollArea className="h-[200px] w-full rounded-lg p-4">
   {isGroup && (
        <ChatMembersCard chatMembers={members} chatroomId={selectedUser?.id} />
      )}
      <ChatInfoViewMedia messages={messages} chatroomId={selectedUser?.id}/>
</ScrollArea> */}
      {isGroup && (
        <ChatMembersCard chatMembers={members} chatroomId={selectedUser?.id} />
      )}
      <ChatInfoViewMedia messages={messages} chatroomId={selectedUser?.id}/>
    </>
  );
}
