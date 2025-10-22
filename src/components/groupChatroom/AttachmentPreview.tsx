import { useState } from "react";
import { File, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "../ui/button";

type AttachmentPreviewProps = {
  urls: string[] | string | undefined;
  onRemove?: (url: string) => void;
  onClick?: (url: string) => void;
};

export default function AttachmentPreview({
  urls,
  onRemove,
  onClick,
}: AttachmentPreviewProps) {
  if (!urls) return null;

  const attachments = Array.isArray(urls) ? urls : [urls];
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getFileType = (url: string): "image" | "video" | "audio" | "file" => {
    const cleanUrl = url.split("?")[0];
    const ext = cleanUrl.split(".").pop()?.toLowerCase();
    if (!ext) return "file";

    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
      return "image";
    if (["mp4", "mov", "webm", "mkv"].includes(ext)) return "video";
    if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
    return "file";
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;

      //  filename from URL
      const filename = decodeURIComponent(
        url.split("/").pop()?.split("?")[0] || "file"
      );
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      //  object URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-3 mt-2 justify-start">
        {attachments.map((url, i) => {
          const type = getFileType(url);

          return (
            <div
              key={i}
              onClick={() => {
                onClick?.(url);
                setPreviewUrl(url);
              }}
              className="relative flex flex-col items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 w-full cursor-pointer hover:opacity-90 transition"
            >
              {type === "image" && (
                <img
                  src={url}
                  alt={`attachment-${i}`}
                  className="w-full h-60 object-cover rounded-lg"
                  loading="lazy"
                />
              )}

              {type === "video" && (
                <video
                  src={url}
                  className="w-full h-60 rounded-lg object-contain"
                  controls
                />
              )}

              {type === "audio" && (
                <div className="w-full">
                  <audio controls src={url} className="w-full"></audio>
                </div>
              )}

              {type === "file" && (
                <div className="flex flex-col items-center justify-center w-full h-60 text-xs text-gray-700 dark:text-gray-200 border border-dashed rounded-lg p-4">
                  <File className="w-8 h-8 mb-2" />
                  <span className="truncate max-w-full text-center">
                    {decodeURIComponent(
                      url.split("/").pop()?.split("?")[0] || "file"
                    )}
                  </span>
                </div>
              )}

              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(url);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full text-red-600 hover:text-white hover:bg-red-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/*  Preview Modal  */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          {previewUrl &&
            (() => {
              const type = getFileType(previewUrl);
              switch (type) {
                case "image":
                  return (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                    />
                  );
                case "video":
                  return (
                    <video
                      src={previewUrl}
                      controls
                      autoPlay
                      className="w-full max-h-[80vh] rounded-lg"
                    />
                  );
                case "file":
                  return (
                    <iframe
                      src={previewUrl}
                      className="w-full h-[80vh] rounded-lg border-none"
                    />
                  );
                default:
                  return (
                    <p className="text-center text-gray-400">
                      Preview not available
                    </p>
                  );
              }
            })()}
          <Button onClick={() => handleDownload(previewUrl!)} className="w-1/3 mx-auto cursor-pointer">Download</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
