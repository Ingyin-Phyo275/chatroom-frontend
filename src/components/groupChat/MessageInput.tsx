import { Send, Paperclip, ImageIcon, VideoIcon, Music } from "lucide-react";

type Props = {
  text: string;
  setText: (val: string) => void;
  sendMessage: () => void;
  editingMessageId: string | null;
  saveEditedMessage: () => void;
  setEditingMessageId: (val: string | null) => void;
  handleAttachmentClick: (type: string) => void;
  showAttachmentMenu: boolean;
  setShowAttachmentMenu: (val: boolean) => void;
};

export default function MessageInput({ text, setText, sendMessage, editingMessageId, saveEditedMessage, setEditingMessageId, handleAttachmentClick, showAttachmentMenu, setShowAttachmentMenu }: Props) {
  return (
    <div className="p-4 border-t flex gap-2 items-center">
      <div className="relative">
        <button onClick={() => setShowAttachmentMenu((prev: boolean) => !prev)} className="p-2 rounded hover:bg-slate-200">
          <Paperclip className="w-5 h-5" />
        </button>
        {showAttachmentMenu && (
          <div className="absolute bottom-full left-0 mb-2 flex flex-col bg-white border rounded shadow-lg z-10">
            <button onClick={() => handleAttachmentClick("image")} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100"><ImageIcon className="w-4 h-4" /> Image</button>
            <button onClick={() => handleAttachmentClick("video")} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100"><VideoIcon className="w-4 h-4" /> Video</button>
            <button onClick={() => handleAttachmentClick("audio")} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100"><Music className="w-4 h-4" /> Audio</button>
          </div>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
        className="flex-1 rounded-2xl resize-none p-2 min-h-[44px] max-h-40 border focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            editingMessageId ? saveEditedMessage() : sendMessage();
          }
        }}
      />

      {editingMessageId && (
        <button onClick={() => { setEditingMessageId(null); setText(""); }} className="px-3 py-1 rounded bg-gray-300 text-gray-800 mr-2">
          Cancel
        </button>
      )}

      <button onClick={editingMessageId ? saveEditedMessage : sendMessage} className="px-4 py-2 rounded-xs bg-primary text-white">
        <Send size={16} />
      </button>
    </div>
  );
}
