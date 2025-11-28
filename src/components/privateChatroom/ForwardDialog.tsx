import * as Avatar from "@radix-ui/react-avatar";

export default function ForwardDialog({
  open,
  onClose,
  chatUsers,
  selectedUsers,
  toggleUserSelection,
  sendForward,
  messageId,
}: {
  open: boolean;
  onClose: () => void;
  chatUsers: any[];
  selectedUsers: number[];
  toggleUserSelection: (userId: number) => void;
  sendForward: (messageId: number, selectedUsers: number[]) => void;
  messageId: number;
}) {
  if (!open) return null;

  const handleSend = () => {
    sendForward(messageId, selectedUsers);
    onClose(); // close modal after sending
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-96">

        <h2 className="text-lg font-semibold mb-3">
          Select users to forward
        </h2>

        <ul className="max-h-64 overflow-y-auto">
          {chatUsers.map((user) => (
            <li
              key={user.id}
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
                checked={selectedUsers.includes(Number(user.id))}
                onChange={() => toggleUserSelection(Number(user.id))}
                className="w-5 h-5"
              />
            </li>
          ))}
        </ul>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
            onClick={onClose}
          >
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
