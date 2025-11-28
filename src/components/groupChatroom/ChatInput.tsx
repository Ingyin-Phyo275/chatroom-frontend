import {
  Send,
  Paperclip,
  X,
  ImageIcon,
  VideoIcon,
  AudioLinesIcon,
  FileIcon,
} from "lucide-react";

import React from "react";

type InputRefs = {
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  audioInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

type ChatInputProps = {
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: () => void;
  editingMessageId: string | null;
  cancelEdit: () => void;
  saveEditedMessage: () => void;
  handleAttachmentClick: (type: string) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>, type: string) => void;
  inputRefs: InputRefs;
  showAttachmentMenu: boolean;
  setShowAttachmentMenu: React.Dispatch<React.SetStateAction<boolean>>;
};

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
}: ChatInputProps) {
  return (
    <div className="border-t p-2 bg-white dark:bg-[#09090B] relative">
      {editingMessageId && (
        <div className="flex justify-between items-center mb-2 bg-yellow-100 dark:text-black p-2 rounded">
          <span>Editing message...</span>
          <button onClick={cancelEdit}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Attachment Button */}
        <button
          onClick={() => setShowAttachmentMenu((prev) => !prev)}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <Paperclip />
        </button>

        {/* Message Input */}
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
          className="flex-1 border rounded px-3 py-2 resize-none"
        />

        {/* Send Button */}
        <button
          onClick={editingMessageId ? saveEditedMessage : sendMessage}
          className="p-2 rounded bg-blue-500 text-white hover:bg-blue-600"
        >
          <Send />
        </button>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={inputRefs.imageInputRef}
        onChange={(e) => handleFileSelect(e, "image")}
        className="hidden"
        multiple
      />
      <input
        type="file"
        accept="video/*"
        ref={inputRefs.videoInputRef}
        onChange={(e) => handleFileSelect(e, "video")}
        className="hidden"
        multiple
      />
      <input
        type="file"
        accept="audio/*"
        ref={inputRefs.audioInputRef}
        onChange={(e) => handleFileSelect(e, "audio")}
        className="hidden"
        multiple
      />
      <input
        type="file"
        ref={inputRefs.fileInputRef}
        onChange={(e) => handleFileSelect(e, "file")}
        className="hidden"
        multiple
      />

      {/*  Attachment Menu  */}
      {showAttachmentMenu && (
        <div className="absolute bottom-16 left-2 bg-white dark:bg-[#09090B] border rounded shadow-lg p-2">
          <button
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 w-full"
            onClick={() => handleAttachmentClick("image")}
          >
            <ImageIcon className="w-4 h-4" /> Image
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 w-full"
            onClick={() => handleAttachmentClick("video")}
          >
            <VideoIcon className="w-4 h-4" /> Video
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 w-full"
            onClick={() => handleAttachmentClick("audio")}
          >
            <AudioLinesIcon className="w-4 h-4" /> Audio
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 w-full"
            onClick={() => handleAttachmentClick("file")}
          >
            <FileIcon className="w-4 h-4" /> File
          </button>
        </div>
      )}
    </div>
  );
}
