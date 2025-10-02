import { X } from "lucide-react";

interface Props {
  previewModal: { type: "image" | "video"; url: string } | null;
  setPreviewModal: (val: null) => void;
  handleDownload: (url: string) => void;
}

export default function PreviewModal({ previewModal, setPreviewModal, handleDownload }: Props) {
  if (!previewModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-[90%] max-h-[90%] flex flex-col items-center justify-center">
        <button
          onClick={() => setPreviewModal(null)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
        >
          <X className="w-6 h-6" />
        </button>

        {previewModal.type === "image" && (
          <img src={previewModal.url} alt="preview" className="max-w-full max-h-[70vh] rounded-lg object-contain mb-4" />
        )}
        {previewModal.type === "video" && (
          <video src={previewModal.url} controls autoPlay className="max-w-full max-h-[70vh] rounded-lg mb-4" />
        )}

        <button
          onClick={() => handleDownload(previewModal.url)}
          className="px-4 py-2 rounded bg-primary text-white"
        >
          Download
        </button>
      </div>
    </div>
  );
}
