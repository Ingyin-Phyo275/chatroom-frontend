import { X, File } from "lucide-react";
import { Button } from "../ui/button";

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
  const handleDownload = async (url: string) => {
      console.log("preview", url)
      const downloadUrl = Array.isArray(url) ? url[0] : url;

    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = downloadUrl.split("/").pop() || "file";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };
  // console.log("Preview modal props:", preview.type, preview.url, preview.name);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-[90%] max-h-[90%] flex flex-col items-center justify-center">
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
          <File className="w-12 h-12 text-slate-500 mb-2" onClick={() => onDownload(preview.url, preview.name || "file")} />
        )}
        <Button
          onClick={() => handleDownload(preview.url)}
          className="w-1/3 mx-auto my-2 cursor-pointer"
        >
          Download
        </Button>
      </div>
    </div>
  );
}
