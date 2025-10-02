import { Paperclip, ImageIcon, VideoIcon, Music, Send } from "lucide-react";

interface Props {
  showAttachmentMenu: boolean;
  setShowAttachmentMenu: (val: boolean) => void;
  handleAttachmentClick: (type: "image" | "video" | "audio" | "file") => void;

  imageInputRef: React.RefObject<HTMLInputElement | null>;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  audioInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function AttachmentInput({
  showAttachmentMenu,
  setShowAttachmentMenu,
  handleAttachmentClick,
  imageInputRef,
  videoInputRef,
  audioInputRef,
  fileInputRef,
}: Props) {
  return (
    <div className="relative">
      <button
        onClick={() => setShowAttachmentMenu((prev) => !prev)}
        className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
        aria-label="attachments"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {showAttachmentMenu && (
        <div className="absolute bottom-full left-0 mb-2 flex flex-col bg-white dark:bg-slate-800 border rounded shadow-lg z-10">
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
            <Music className="w-4 h-4" /> Audio
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => handleAttachmentClick("file")}
          >
            <Send className="w-4 h-4" /> File
          </button>
        </div>
      )}

      {/* hidden inputs */}
      <input type="file" accept="image/*" multiple className="hidden" ref={imageInputRef} />
      <input type="file" accept="video/*" multiple className="hidden" ref={videoInputRef} />
      <input type="file" accept="audio/*" multiple className="hidden" ref={audioInputRef} />
      <input type="file" multiple className="hidden" ref={fileInputRef} />
    </div>
  );
}
