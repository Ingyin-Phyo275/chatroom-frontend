import * as Avatar from "@radix-ui/react-avatar";
import type { GroupChatResponse } from "../../dto/response/ChatRoom";

type SelectedItem = { type: "user" | "group"; id: number };

export default function ForwardDialog({
  open,
  onClose,
  chatUsers,
  groupChats,
  selectedUsers,
  toggleUserSelection,
  sendForward,
  messageId,
}: {
  open: boolean;
  onClose: () => void;
  chatUsers: any[];
  groupChats: GroupChatResponse[];
  selectedUsers: SelectedItem[];
  toggleUserSelection: (item: SelectedItem) => void;
  sendForward: (messageId: number, selectedUsers: SelectedItem[]) => void;
  messageId: number;
}) {
  if (!open) return null;

  const handleSend = () => {
    sendForward(messageId, selectedUsers);
    onClose();
  };

  const isSelected = (type: "user" | "group", id: number) =>
    selectedUsers.some(item => item.type === type && item.id === id);

  const handleToggle = (type: "user" | "group", id: number) => {
    toggleUserSelection({ type, id });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-96">
        <h2 className="text-lg font-semibold mb-3">Select users to forward</h2>

        <div className="max-h-128 overflow-y-auto">
          <h1 className="font-semibold">Users</h1>
          <ul>
            {chatUsers.map(user => (
              <li
                key={`user-${user.id}`}
                className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <div className="flex items-center gap-3">
                  <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                    <Avatar.Image
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                    <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-500 text-white text-xs font-semibold">
                      {user.username.slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>

                  <span className="text-sm">{user.username}</span>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected("user", user.id)}
                  onChange={() => handleToggle("user", user.id)}
                  className="w-5 h-5"
                />
              </li>
            ))}
          </ul>

          <h1 className="font-semibold">Groups</h1>
          <ul>
            {groupChats.map(group => (
              <li
                key={`group-${group.id}`}
                className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <div className="flex items-center gap-3">
                  <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                    <Avatar.Image src={""} alt={group.name} className="w-full h-full object-cover" />
                    <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-500 text-white text-xs font-semibold">
                      {group.name.slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>

                  <span className="text-sm">{group.name}</span>
                </div>

                <input
                  type="checkbox"
                  checked={isSelected("group", Number(group.id))}
                  onChange={() => handleToggle("group", Number(group.id))}
                  className="w-5 h-5"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
            disabled={selectedUsers.length === 0}
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
