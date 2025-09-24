import { Button } from "./ui/button";
import { Bell, Contact, CirclePlus } from "lucide-react";
import ChatMembersCard from "./chat-member-card";
import * as Avatar from "@radix-ui/react-avatar";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MemberAddForm from "./member-add-form";
import { Dialog, DialogClose, DialogContent, DialogHeader } from "./ui/dialog";
import { userListQuery } from "../composables/Queries/userListQuery";

interface ChatInfoProps {
  selectedUser: any;
}

export default function ChatInfoPanel({ selectedUser }: ChatInfoProps) {
  const { userListData } = userListQuery();
  const [isOpen, setIsOpen] = useState(false);

  const members = selectedUser?.chatroomDetails?.[0]?.members;

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
          {selectedUser?.is_group ? (
            <div className="flex flex-col items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition">
                    <CirclePlus className="h-6 w-6" />
                  </button>
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
                  <div className="mt-4">
                    <MemberAddForm
                      contacts={userListData ?? []}
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

      {selectedUser?.is_group && <ChatMembersCard chatMembers={members} chatroomId={selectedUser?.id}/>}
    </>
  );
}
