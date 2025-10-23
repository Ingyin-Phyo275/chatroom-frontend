import type { ChatUserType } from "@/dto/UserTypes";
import * as Avatar from "@radix-ui/react-avatar";
import ChatAction from "./chat-action";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import React, { useState } from "react";
import type { UserListResponse } from "../dto/response/UserListResponse";
import type { GroupChatResponse } from "../dto/response/ChatRoom";
import { useGroupChatList } from "../composables/Queries/useGroupChatList";
import { userListQuery } from "../composables/Queries/userListQuery";
import { chatUserListQuery } from "../composables/Queries/ChatUserListQuery";
import { Badge } from "@/components/ui/badge";
import useCounterStore from "../store/UnreadCount";
import formatLastSeen from "@/utils/helper";

interface ChatUsersProps {
  tabs: string;
  onSelectUser: (user: ChatUserType) => void;
}

export default function ChatUsers({ tabs, onSelectUser }: ChatUsersProps) {
  const { setValue, getValue, getType } = useCounterStore();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredUsers, setFilteredUsers] = useState<ChatUserType[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(13);

  //group chats list
  const { groupChatListQuery: groupChatList = [] as GroupChatResponse[] } =
    useGroupChatList({ page, pageSize });

  //user's contact list
  const { userListData: contact = [] as UserListResponse[] } = userListQuery();

  //user's personal chat list
  const { userListData: users = [] as ChatUserType[] } = chatUserListQuery();
  // console.log("result in chat users", users);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  //zustand
  //console.log("zustand value", value)

  React.useEffect(() => {
    let newFiltered: ChatUserType[] = [];
    if (tabs === "Contacts") {
      newFiltered = contact.filter((c) =>
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
      ) as unknown as ChatUserType[];
    } else if (tabs === "Group") {
      newFiltered = groupChatList
        .filter((g: GroupChatResponse) =>
          g.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((g: GroupChatResponse) => ({
          id: String(g.id),
          username: g.name,
          status: "online",
          is_group: true,
          tabs: "Group",
          avatar_url: "",
          unreadCount: g.unreadCount,
          last_seen: g.last_seen,
        }));
    } else {
      newFiltered = users
        .filter((user) => (tabs === "Personal" ? !user.is_group : true))
        .filter((user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
        ) as ChatUserType[];
    }
    // Only update state if it’s different
    setFilteredUsers((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(newFiltered)) return prev;
      return newFiltered;
    });
  }, [tabs, users, contact, groupChatList, searchTerm]);

  const handleClick = async (user: ChatUserType) => {
    onSelectUser(user);
  };

  React.useEffect(() => {
    filteredUsers.forEach((user) => {
      setValue(user.id, user?.unreadCount || 0, user?.tabs || "Personal");
    });
  }, [filteredUsers, setValue]);

  // console.log("filter users", filteredUsers)

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
              className={`relative w-10 h-10 ${
                user.status === "online" ? "ring-2 ring-green-500" : ""
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
              <span className="font-medium">
                {user.username}
                {tabs !== "Contacts" ? (
                  <>
                    {(() => {
                      const count = getValue(user.id);
                      const type = getType(user.id);

                      if (count <= 0) return null;

                      if (type === "Group") {
                        return (
                          <Badge className="h-5 min-w-5 rounded-full px-1 ml-2 font-mono tabular-nums bg-green-500 text-white">
                            {count}
                          </Badge>
                        );
                      }

                      if (type === "Personal") {
                        return (
                          <Badge className="h-5 min-w-5 rounded-full px-1 ml-2 font-mono tabular-nums bg-blue-500 text-white">
                            {count}
                          </Badge>
                        );
                      }

                      return null;
                    })()}
                  </>
                ) : null}
              </span>
              {!user.is_group && (
                <span
                  className={`text-xs ${
                    user.status === "online"
                      ? "text-green-500"
                      : "text-gray-400 dark:text-gray-300"
                  }`}
                >
                  {user.status === "online"
                    ? "Online"
                    : formatLastSeen(user?.last_seen)}
                </span>
              )}
            </div>
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
