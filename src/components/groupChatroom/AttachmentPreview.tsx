import { File, X } from "lucide-react";

type AttachmentPreviewProps = {
  urls: string[] | string | undefined;
  onRemove?: (url: string) => void;
};

export default function AttachmentPreview({ urls, onRemove }: AttachmentPreviewProps) {
  if (!urls) return null;

  const attachments = Array.isArray(urls) ? urls : [urls];

  const getFileType = (url: string): "image" | "video" | "audio" | "file" => {
    const cleanUrl = url.split("?")[0];
    const ext = cleanUrl.split(".").pop()?.toLowerCase();
    if (!ext) return "file";

    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
    if (["mp4", "mov", "webm", "mkv"].includes(ext)) return "video";
    if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
    return "file";
  };

  return (
    <div className="flex flex-wrap gap-3 mt-2 justify-start">
      {attachments.map((url, i) => {
        const type = getFileType(url);

        return (
          <div
            key={i}
            className="relative flex flex-col items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 w-full "
          >
            {/* Image */}
            {type === "image" && (
              <img
                src={url}
                alt={`attachment-${i}`}
                className="w-full h-60 object-cover rounded-lg cursor-pointer"
                loading="lazy"
              />
            )}

            {/* Video */}
            {type === "video" && (
              <video
                src={url}
                className="w-full h-60 rounded-lg object-contain"
                controls
              />
            )}

            {/* Audio */}
            {type === "audio" && (
              <div className="w-full">
                {/* <AudioMessage file={url} /> */}
                <audio controls src={url} className="w-full"></audio>
              </div>
            )}

            {/* File */}
            {type === "file" && (
              <div className="flex flex-col items-center justify-center w-full h-60 text-xs text-gray-700 dark:text-gray-200 border border-dashed rounded-lg p-4">
                <File className="w-8 h-8 mb-2" />
                <span className="truncate max-w-full text-center">
                  {decodeURIComponent(url.split("/").pop()?.split("?")[0] || "file")}
                </span>
              </div>
            )}

            {/* Remove Button */}
            {onRemove && (
              <button
                onClick={() => onRemove(url)}
                className="absolute top-2 right-2 p-1 rounded-full text-red-600 hover:text-white hover:bg-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Download Button
            <a
              href={url}
              download
              className="absolute bottom-2 right-2 p-1 rounded text-green-600 hover:text-white hover:bg-green-600"
            >
              <Download className="w-5 h-5" />
            </a> */}
          </div>
        );
      })}
    </div>
  );
}
