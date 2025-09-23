import type { ChatUserType } from "@/dto/UserTypes";
import { Button } from "./ui/button";
import { Bell, Contact, UserPlus } from "lucide-react";
import ChatMembersCard from "./chat-member-card";

interface ChatInfoProps {
  selectedUser: ChatUserType;
}
export default function ChatInfoPanel({ selectedUser }: ChatInfoProps) {
  const chatMembers: ChatUserType[] = [
    {
      id: "1",
      username: "Alice",
      status: "Online",
      tabs: "Group",
      avatar_url: "https://i.pravatar.cc/150?img=1",
    },
    {
      id: "2",
      username: "Bob",
      status: "Offline",
      tabs: "Private",
      avatar_url: "https://i.pravatar.cc/150?img=2",
    },
    {
      id: "3",
      username: "Charlie",
      status: "Busy",
      tabs: "Group",
      avatar_url: "https://i.pravatar.cc/150?img=3",
    },
    {
      id: "4",
      username: "Diana",
      status: "Away",
      tabs: "Private",
      avatar_url: "https://i.pravatar.cc/150?img=4",
    },
    {
      id: "5",
      username: "Eve",
      status: "Online",
      tabs: "Group",
      avatar_url: "https://i.pravatar.cc/150?img=5",
    },
  ];
  return (
    <>
      <div className="flex flex-col items-center">
        <img
          src={selectedUser.avatar_url}
          alt={selectedUser.username}
          className="w-20 h-20 rounded-full object-cover mb-3"
        />
        <p className="font-medium">{selectedUser.username}</p>
        <div className="flex flex-row gap-2 mt-4">
          {selectedUser.is_group === true ? (
            <div className="flex flex-col">
              <Button variant={"ghost"} className="rounded-full" size={"icon"} onClick={() => alert("Add")}>
                <UserPlus className="w-4 h-4" />
              </Button>
              <p className="text-xs text-center">Add</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <Button variant={"ghost"} className="rounded-full" size={"icon"} onClick={() => alert("Profile")}>
                <Contact className="w-4 h-4" />
              </Button>
              <p className="text-xs text-center">Profile</p>
            </div>
          )}
          <div className="flex flex-col">
            <Button variant={"ghost"} className=" rounded-full" size={"icon"} onClick={() => alert("Muted")}>
              <Bell className="w-4 h-4" />
            </Button>
            <p className="text-xs text-center">Mute</p>
          </div>
        </div>
      </div>

      {
        selectedUser.is_group === true && <ChatMembersCard chatMembers={chatMembers} />
      }
    </>
  );
}
