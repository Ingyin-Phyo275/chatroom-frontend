import type { ChatUserType } from "@/dto/UserTypes";
import * as Avatar from "@radix-ui/react-avatar";

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
  const filteredUsers =
    tabs === "All" ? users : users.filter((u) => u.tabs === tabs);

    const handleClick = async (user: ChatUserType) => {
      onSelectUser(user);
    }
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => handleClick(user)}
            className="flex items-center gap-3 px-4 py-3 border-b dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
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
            <div className="flex flex-col">
              <span className="font-medium">{user.username}</span>
              <span
                className={`text-xs ${
                  user.status === "online"
                    ? "text-green-500"
                    : "text-gray-400 dark:text-gray-300"
                }`}
              >
                {user.status === "online" ? "Online" : "Offline"}
              </span>
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
