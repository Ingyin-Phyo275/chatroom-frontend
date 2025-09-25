import type { ChatUserType } from "@/dto/UserTypes";
import * as Avatar from "@radix-ui/react-avatar";
import ChatAction from "./chat-action";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import React, { useState } from "react";
import type { UserListResponse } from "../dto/response/UserListResponse";
import type { GroupChatResponse } from "../dto/response/ChatRoom";
import { getChatroomDetails } from "../http/api/getChatroomDetails";
import { useGroupChatList } from "../composables/Queries/useGroupChatList";
import { userListQuery } from "../composables/Queries/userListQuery";

interface ChatUsersProps {
  users: ChatUserType[];
  tabs: string;
  onSelectUser: (user: ChatUserType) => void;
}

export default function ChatUsers({
  users,
  tabs,
  onSelectUser,
}: ChatUsersProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredUsers, setFilteredUsers] = useState<ChatUserType[]>([]);

  const { groupChatListQuery: groupChatList = [] as GroupChatResponse[]} =  useGroupChatList();//    console.log("group chat props", groupsChats);
  const { userListData: contact =[] as UserListResponse[]}  = userListQuery();

// console.log("grou chat list", groupChatList);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  React.useEffect(() => {
    if (tabs === "Contacts") {
      const filteredContacts = contact.filter((c) =>
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filteredContacts as unknown as ChatUserType[]);
    } else if (tabs === "Group") {
      const filteredGroups = groupChatList.filter((g: GroupChatResponse) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Adapt GroupChatResponse -> ChatUserType shape
      const mappedGroups: ChatUserType[] = filteredGroups.map((g: GroupChatResponse) => ({
        id: String(g.id),
        username: g.name,
        status: "online", // groups don’t have status → default
        is_group: true,
        tabs: "Group",
        avatar_url: "", // default group avatar
      }));

      setFilteredUsers(mappedGroups);
    } else {
      // All / Personal from dummy users
      const filtered = users
        .filter((user) => {
          if (tabs === "Personal") return !user.is_group;
          return true; // "All"
        })
        .filter((user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
      setFilteredUsers(filtered);
    }
  }, [tabs, users, contact, groupChatList, searchTerm]);

  const handleClick = async (user: ChatUserType) => {
    const group = groupChatList.find((g:GroupChatResponse) => String(g.id) === String(user.id));

    if (group) {
      try {
        const response = await getChatroomDetails(group.id); // call API directly
        console.log("chat room details", response);

        onSelectUser({
          ...user,
          chatroomDetails: response,
        } as ChatUserType & { chatroomDetails: any });
      } catch (error) {
        console.error("Failed to fetch group chatroom details:", error);
      }
    } else {
      onSelectUser(user);
    }
  };



  return (
    <div className="flex flex-col h-full w-full">
      {/* Search bar */}
      <div className="relative flex items-center w-full">
        <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-9 pr-3 w-full"
        />
      </div>

      {/* User / Group list */}
      <div className="flex-1 overflow-auto">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => handleClick(user)}
            className="flex items-center gap-3 px-4 py-3 border-b dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            {/* Avatar */}
            <div
              className={`relative w-10 h-10 ${user.status === "online" ? "ring-2 ring-green-500" : ""
                } rounded-full`}
            >
              <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                <Avatar.Image
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover"
                />
                <Avatar.Fallback className="w-full h-full rounded-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                  {user.username.slice(0, 2).toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
            </div>

            {/* Name + status */}
            <div className="flex flex-col">
              <span className="font-medium">{user.username}</span>
              {!user.is_group && (
                <span
                  className={`text-xs ${user.status === "online"
                      ? "text-green-500"
                      : "text-gray-400 dark:text-gray-300"
                    }`}
                >
                  {user.status === "online" ? "Online" : "Offline"}
                </span>
              )}
            </div>

            {/* Actions (skip for group if not needed) */}

            <div className="ml-auto">
              <ChatAction user={user} />
            </div>

          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="p-4 text-center text-gray-400 dark:text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}
