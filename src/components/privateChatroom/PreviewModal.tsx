import { X, Download } from "lucide-react";

type PreviewModalProps = {
  preview: {
    type: "image" | "video" | "audio" | "file";
    url: string;
    name?: string;
  };
  onClose: () => void;
  onDownload: (url: string, filename: string) => void;
};

export default function PreviewModal({ preview, onClose, onDownload }: PreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-[90%] max-h-[90%] flex items-center justify-center">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-gray-200 rounded-full p-1"
        >
          <X />
        </button>

        {/* Content */}
        {preview.type === "image" && (
          <img src={preview.url} alt="preview" className="max-h-[80vh]" />
        )}
        {preview.type === "video" && (
          <video controls className="max-h-[80vh]">
            <source src={preview.url} />
          </video>
        )}
        {preview.type === "audio" && <audio controls src={preview.url}></audio>}
        {preview.type === "file" && (
          <button
            onClick={() => onDownload(preview.url, preview.name || "file")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            <Download /> {preview.name || "Download file"}
          </button>
        )}
      </div>
    </div>
  );
}
