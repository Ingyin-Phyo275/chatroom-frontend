import { Send, Paperclip, X, ImageIcon, VideoIcon, AudioLinesIcon, FileIcon } from "lucide-react";

export default function ChatInput({
  text,
  setText,
  sendMessage,
  editingMessageId,
  cancelEdit,
  saveEditedMessage,
  handleAttachmentClick,
  handleFileSelect,
  inputRefs,
  showAttachmentMenu,
  setShowAttachmentMenu,
  isSending, // isSending prop to control sending state
}: any) {
  return (
    <div className="border-t p-2 bg-white relative">
      {editingMessageId && (
        <div className="flex justify-between items-center mb-2 bg-yellow-100 p-2 rounded">
          <span>Editing message...</span>
          <button onClick={cancelEdit}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Attachment Button */}
        <button
          onClick={() => setShowAttachmentMenu((prev: boolean) => !prev)}
          className={`p-2 rounded hover:bg-gray-200 ${isSending ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={isSending} // Disable attachment button while sending
        >
          <Paperclip />
        </button>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              editingMessageId ? saveEditedMessage() : sendMessage();
            }
          }}
          placeholder="Type a message..."
          className={`flex-1 border rounded px-3 py-2 ${isSending ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={isSending} // Disable input while sending
        />

        {/* Send Button */}
        <button
          onClick={editingMessageId ? saveEditedMessage : sendMessage}
          className={`p-2 rounded bg-blue-500 text-white ${isSending ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={isSending} // Disable send button while sending
        >
          <Send />
        </button>
      </div>

      {/* Hidden Inputs for Attachments */}
      <input
        type="file"
        accept="image/*"
        ref={inputRefs.imageInputRef}
        onChange={(e) => handleFileSelect(e, "image")}
        className="hidden"
        multiple
        disabled={isSending} // Disable file input while sending
      />
      <input
        type="file"
        accept="video/*"
        ref={inputRefs.videoInputRef}
        onChange={(e) => handleFileSelect(e, "video")}
        className="hidden"
        multiple
        disabled={isSending} // Disable file input while sending
      />
      <input
        type="file"
        accept="audio/*"
        ref={inputRefs.audioInputRef}
        onChange={(e) => handleFileSelect(e, "audio")}
        className="hidden"
        multiple
        disabled={isSending} // Disable file input while sending
      />
      <input
        type="file"
        ref={inputRefs.fileInputRef}
        onChange={(e) => handleFileSelect(e, "file")}
        className="hidden"
        multiple
        disabled={isSending} // Disable file input while sending
      />

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <div className="absolute bottom-16 left-2 bg-white border rounded shadow-lg p-2">
          <button
            className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${isSending ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => handleAttachmentClick("image")}
            disabled={isSending} // Disable attachment options while sending
          >
            <ImageIcon className="w-4 h-4" /> Image
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${isSending ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => handleAttachmentClick("video")}
            disabled={isSending} // Disable attachment options while sending
          >
            <VideoIcon className="w-4 h-4" /> Video
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${isSending ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => handleAttachmentClick("audio")}
            disabled={isSending} // Disable attachment options while sending
          >
            <AudioLinesIcon className="w-4 h-4" /> Audio
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${isSending ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => handleAttachmentClick("file")}
            disabled={isSending} // Disable attachment options while sending
          >
            <FileIcon className="w-4 h-4" /> File
          </button>
        </div>
      )}
    </div>
  );
}
