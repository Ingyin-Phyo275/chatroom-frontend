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
}: any) {
  return (
    <div className="border-t p-2 bg-white">
      {editingMessageId && (
        <div className="flex justify-between items-center mb-2 bg-yellow-100 p-2 rounded">
          <span>Editing message...</span>
          <button onClick={cancelEdit}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAttachmentMenu((prev: boolean) => !prev)}
          className="p-2 rounded hover:bg-gray-200"
        >
          <Paperclip />
        </button>

        {/* Text */}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
        />

        <button
          onClick={editingMessageId ? saveEditedMessage : sendMessage}
          className="p-2 rounded bg-blue-500 text-white"
        >
          <Send />
        </button>
      </div>

      {/* Hidden Inputs */}
      <input
        type="file"
        accept="image/*"
        ref={inputRefs.imageInputRef}
        onChange={(e) => handleFileSelect(e, "image")}
        className="hidden"
      />
      <input
        type="file"
        accept="video/*"
        ref={inputRefs.videoInputRef}
        onChange={(e) => handleFileSelect(e, "video")}
        className="hidden"
      />
      <input
        type="file"
        accept="audio/*"
        ref={inputRefs.audioInputRef}
        onChange={(e) => handleFileSelect(e, "audio")}
        className="hidden"
      />
      <input
        type="file"
        ref={inputRefs.fileInputRef}
        onChange={(e) => handleFileSelect(e, "file")}
        className="hidden"
      />

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <div className="absolute bottom-16 left-2 bg-white border rounded shadow-lg p-2">
          <button
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => handleAttachmentClick("image")}
          >
            <ImageIcon className="w-4 h-4" /> Image
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => handleAttachmentClick("video")}
          >
            <VideoIcon className="w-4 h-4" /> Video
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => handleAttachmentClick("audio")}
          >
            <AudioLinesIcon className="w-4 h-4" /> Audio
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => handleAttachmentClick("file")}
          >
            <FileIcon className="w-4 h-4" /> File
          </button>
        </div>
      )}
    </div>
  );
}
