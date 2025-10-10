import React from "react";
import AudioMessage from "../AudioPlayer";

const AttachmentPreview = React.memo(function AttachmentPreview({ url }: { url: string }) {
  // Avoid recomputing URL or regex matching unnecessarily
  const filePath = React.useMemo(() => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }, [url]);

  // Determine file type only once per URL
  const type = React.useMemo(() => {
    if (/\.(jpeg|jpg|png|gif|webp|avif)$/i.test(filePath)) return "image";
    if (/\.(mp4|webm)$/i.test(filePath)) return "video";
    if (/\.(mp3|wav)$/i.test(filePath)) return "audio";
    return "file";
  }, [filePath]);

  if (type === "image") {
    return (
      <img
        src={url}
        className="max-w-full max-h-60 rounded-lg mb-1 transition-opacity duration-300 opacity-0"
        alt="attachment"
        loading="lazy"
        onLoad={(e) => (e.currentTarget.style.opacity = "1")} // smooth fade-in
      />
    );
  }

  if (type === "video") {
    return (
      <video
        src={url}
        controls
        className="max-w-full max-h-60 rounded-lg"
      />
    );
  }

  if (type === "audio") {
    return <AudioMessage file={url} />;
  }

  return (
    <></>
  );
});

export default AttachmentPreview;
