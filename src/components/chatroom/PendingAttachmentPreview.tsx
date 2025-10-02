import { X, Download } from "lucide-react";
import AudioMessage from "../AudioPlayer";

export type PendingAttachmentType = "image" | "video" | "audio" | "file";

export interface PendingAttachment {
  type: PendingAttachmentType;
  file: File;
  url?: string;
}

interface Props {
  pendingAttachments: PendingAttachment[];
  setPendingAttachments: (attachments: PendingAttachment[]) => void;
  setPreviewModal: ((modal: { type: "image" | "video"; url: string } | null)) => void;
}

export default function PendingAttachmentsPreview({
  pendingAttachments,
  setPendingAttachments,
  setPreviewModal,
}: Props) {
  if (pendingAttachments.length === 0) return null;

  return (
    <div className="p-2 flex gap-3 overflow-x-auto border-t border-b bg-slate-100 dark:bg-slate-800">
      {pendingAttachments.map((att, i) => (
        <div
          key={i}
          className="relative rounded-lg border dark:border-slate-600 p-2 flex flex-col items-center justify-center"
        >
          {att.type === "image" && (
            <img
              src={att.url ?? URL.createObjectURL(att.file)}
              alt={att.file.name}
              className="max-w-[120px] max-h-[80px] rounded cursor-pointer"
              onClick={() =>
                setPreviewModal({
                  type: "image",
                  url: att.url ?? URL.createObjectURL(att.file),
                })
              }
            />
          )}

          {att.type === "video" && (
            <video
              src={att.url ?? URL.createObjectURL(att.file)}
              className="max-w-[120px] max-h-[80px] rounded cursor-pointer"
              onClick={() =>
                setPreviewModal({
                  type: "video",
                  url: att.url ?? URL.createObjectURL(att.file),
                })
              }
            />
          )}

          {att.type === "audio" && <AudioMessage file={att.file} />}

          {att.type === "file" && (
            <div className="flex flex-col items-center text-xs">
              {att.file.name}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <a
              href={att.url ?? URL.createObjectURL(att.file)}
              download={att.file.name}
              className="p-1 rounded text-green-600 hover:text-white hover:bg-green-600"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={() =>
                setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))
              }
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
