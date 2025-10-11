import { Download, File, X } from "lucide-react";
import AudioMessage from "../AudioPlayer";
import type { Attachment } from "@/dto/types/Attachments";

type PendingAttachmentsProps = {
  pendingAttachments: Attachment[];
  setPendingAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  setPreviewModal: React.Dispatch<
    React.SetStateAction<{ type: string; url: string } | null>
  >;
};

export default function PendingAttachments({
  pendingAttachments,
  setPendingAttachments,
  setPreviewModal,
}: PendingAttachmentsProps) {
  if (pendingAttachments.length === 0) return null;

  return (
    <div className="p-2 flex gap-3 overflow-x-auto border-t border-b bg-slate-100 dark:bg-slate-800">
      {pendingAttachments.map((att, i) => (
        <div
          key={i}
          className="relative rounded-lg border dark:border-slate-600 p-2 flex flex-col items-center justify-center"
        >
          {att.type === "image" && att.url && (
            <img
              src={att.url}
              alt={att.file.name}
              className="max-w-[120px] max-h-[80px] rounded cursor-pointer"
              onClick={() => setPreviewModal({ type: "image", url: att.url! })}
            />
          )}

          {att.type === "video" && att.url && (
            <video
              src={att.url}
              className="max-w-[120px] max-h-[80px] rounded cursor-pointer"
              onClick={() => setPreviewModal({ type: "video", url: att.url! })}
            />
          )}

          {att.type === "audio" && att.url && <AudioMessage file={att.url} />}

          {att.type === "file" && (
            <div className="flex flex-col items-center text-xs">
              <File className="w-6 h-6" />
              {att.file.name}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            {att.url && (
              <a
                href={att.url}
                download={att.file.name}
                className="p-1 rounded text-green-600 hover:text-white hover:bg-green-600"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => {
                if (att.url) URL.revokeObjectURL(att.url);
                setPendingAttachments((prev) =>
                  prev.filter((_, idx) => idx !== i)
                );
              }}
              className="p-1 rounded text-red-600 hover:text-white hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
