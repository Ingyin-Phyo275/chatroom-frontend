import { X } from "lucide-react";

export default function AttachmentPreview({
  attachments,
  setAttachments,
  setPreviewModal,
}: {
  attachments: any[];
  setAttachments: (atts: any[]) => void;
  setPreviewModal: (preview: any) => void;
}) {
  if (!attachments.length) return null;

  return (
    <div className="flex gap-2 p-2 bg-gray-100 border-t">
      {attachments.map((att, idx) => (
        <div key={idx} className="relative">
          {att.type === "image" && (
            <img
              src={att.url}
              alt="preview"
              className="h-16 w-16 object-cover rounded cursor-pointer"
              onClick={() => setPreviewModal(att)}
            />
          )}
          {att.type === "video" && (
            <video
              className="h-16 w-16 rounded cursor-pointer"
              onClick={() => setPreviewModal(att)}
            >
              <source src={att.url} />
            </video>
          )}
          {att.type === "audio" && <audio controls src={att.url}></audio>}
          {att.type === "file" && <p className="text-xs">{att.name}</p>}

          {/* Remove */}
          <button
            onClick={() =>
              setAttachments(attachments.filter((_, i) => i !== idx))
            }
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
