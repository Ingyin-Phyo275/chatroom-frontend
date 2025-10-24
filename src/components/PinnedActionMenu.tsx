import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal
} from "./ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";

interface PinnedActionMenuProps {
  messageId: number;
  onUnpin: () => void;
}

export default function PinnedActionMenu({ messageId, onUnpin }: PinnedActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700">
          <EllipsisVertical className="w-5 h-5 text-gray-500" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          align="end"
          className="w-28 z-[70] bg-white dark:bg-slate-800 shadow-md rounded-md"
        >
          <DropdownMenuItem onClick={onUnpin} className="text-red-600 cursor-pointer">
            Unpin
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
