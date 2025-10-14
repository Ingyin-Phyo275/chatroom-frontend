import  { useState } from "react";
import type { GetAllMessage } from "@/dto/response/GetAllMessage";
import { X } from "lucide-react";
import { getChatroomMedia } from "../../http/api/groupChat/getChatroomMedia";

interface ChatInfoViewMediaProps {
  chatroomId: number;
  messages: GetAllMessage[];
}

export default function ChatInfoViewMedia({ chatroomId, messages }: ChatInfoViewMediaProps) {
  const [preview, setPreview] = useState<{ type: "image" | "video"; url: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [allMedia, setAllMedia] = useState<{ type: "image" | "video"; url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Flatten first 3 attachments from messages
  const mediaItems = messages
    .flatMap(msg =>
      msg.attachment_url?.map((url, idx) => ({
        url,
        type: url?.endsWith(".mp4") || url?.endsWith(".mov") ? "video" : "image",
        id: `${msg.id}-${idx}`,
      })) || []
    )
    .filter(Boolean);

  if (mediaItems.length === 0) return null;

  const itemsToShow = mediaItems.slice(0, 3);
  const remainingCount = mediaItems.length - 3;

  const handleViewAll = async () => {
    setModalOpen(true);
    setLoading(true);
    try {
      const res = await getChatroomMedia(chatroomId); // API should return array of {url, type}
      setAllMedia(res || []);
    } catch (err) {
      console.error("Failed to fetch media:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-4 bg-secondary rounded-lg mb-5">
      <div className="grid grid-cols-3 gap-2">
{itemsToShow.map((item, idx) => (
  <div
    key={idx}
    className="relative w-full h-24 overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
    onClick={() => {
      // Skip preview if this is the +N more block
      if (idx === 2 && remainingCount > 0) return handleViewAll();
      //@ts-ignore
      setPreview(item);
    }}
  >
    {item.type === "image" ? (
      <img src={item.url} alt={`media-${idx}`} className="w-full h-full object-cover" />
    ) : (
      <video src={item.url} className="w-full h-full object-cover" muted loop playsInline />
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
            <img src={preview.url} alt="preview" className="max-w-[90%] max-h-[90%] rounded-lg" />
          ) : (
            <video src={preview.url} controls autoPlay className="max-w-[90%] max-h-[90%] rounded-lg" />
          )}
        </div>
      )}

      {/* Modal for all media */}
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

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {allMedia.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative w-full h-24 overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
                    onClick={() => setPreview(item)}
                  >
                    {item.type === "image" ? (
                      <img src={item.url} alt={`media-${idx}`} className="w-full h-full object-cover" />
                    ) : (
                      <video src={item.url} className="w-full h-full object-cover" muted loop playsInline />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
