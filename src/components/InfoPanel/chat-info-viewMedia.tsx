"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface MediaItem {
  url: string;
  type: "image" | "video";
  id?: string;
}

interface ChatInfoViewMediaProps {
  media?: string[];
  messages?: any[];
  chatroomId?: string;
}

export default function ChatInfoViewMedia({ media }: ChatInfoViewMediaProps) {
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (!media || media.length === 0) return null;

  // Convert string URLs to MediaItem objects
  const mediaItems: MediaItem[] = media.map((url, idx) => ({
    url,
    type: url.endsWith(".mp4") || url.endsWith(".mov") ? "video" : "image",
    id: `media-${idx}`,
  }));

  const itemsToShow = mediaItems.slice(0, 3);
  const remainingCount = mediaItems.length - 3;
  console.log("media", media);
  return (
    <div className="w-full max-w-md mx-auto mt-2 bg-secondary rounded-lg mb-10 p-2">
      <p className="font-semibold mb-2">View Media</p>

      {/* Thumbnails */}
      <div className="grid grid-cols-3 gap-2">
        {itemsToShow.map((item, idx) => (
          <div
            key={item.id}
            className="relative w-full h-24 overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
            onClick={() => {
              if (idx === 2 && remainingCount > 0) return setModalOpen(true);
              setPreview(item); // open fullscreen preview
            }}
          >
            {item.type === "image" ? (
              <img
                src={item.url}
                alt={`media-${idx}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={item.url}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
              />
            )}

            {idx === 2 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-semibold">
                +{remainingCount} more
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen Preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <button
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 p-2 rounded-full text-white hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
          {preview.type === "image" ? (
            <img
              src={preview.url}
              alt="preview"
              className="max-w-[90%] max-h-[90%] rounded-lg"
            />
          ) : (
            <video
              src={preview.url}
              controls
              autoPlay
              className="max-w-[90%] max-h-[90%] rounded-lg"
            />
          )}
        </div>
      )}

      {/* Modal for All Media */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-lg p-4">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold mb-4">All Media</h2>
            <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-2 max-h-[17rem] overflow-y-auto pr-1">
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  className="relative w-full h-32 overflow-hidden rounded-lg bg-gray-100 cursor-pointer border border-gray-500"
                  onClick={() => {
                    setPreview(item);
                    setModalOpen(false);
                  }}
                >
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt="media"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="w-full h-full rounded-lg object-contain"
                      controls
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
