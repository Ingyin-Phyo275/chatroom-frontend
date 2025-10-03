import { Pen, Download } from "lucide-react";

export default function MessageActions({
  message,
  onEdit,
  onDownload,
}: {
  message: any;
  onEdit: (id: string, content: string) => void;
  onDownload: (url: string, filename: string) => void;
}) {
  return (
    <div className="flex justify-end gap-2 mt-1 text-xs opacity-70">
      <button
        onClick={() => onEdit(message.id, message.text)}
        className="flex items-center gap-1 hover:text-blue-600"
      >
        <Pen size={14} /> Edit
      </button>
      {message.attachments?.map((att: any, idx: number) =>
        att.type === "file" ? (
          <button
            key={idx}
            onClick={() => onDownload(att.url, att.name)}
            className="flex items-center gap-1 hover:text-green-600"
          >
            <Download size={14} /> Download
          </button>
        ) : null
      )}
    </div>
  );
}
