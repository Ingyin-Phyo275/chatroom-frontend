export interface PrivateChatMessage {
 id: string;
  sender: string | { id?: number | string; username?: string } | any; // sometimes object depending on api
  receiver?: string | { id?: number | string; username?: string } | any;
  content: string;
  created_at: string;
  is_delivered?: boolean;
  is_pinned?: boolean;
  attachments?: {path: string; type: "image" | "video" | "audio" | "file"; }[]; // Deprecated, use attachment_url or attachment_urls
  attachment_url?: string | null;
 attachment_urls?: string[] | null; 
  imagePath?: string | null;
  imagePaths?: string[] | null;
  attachmentType?: "image" | "video" | "audio" | "file" | null;
  attachmentTypes?: ("image" | "video" | "audio" | "file")[] | null;
  is_group?: boolean;
  is_edit?: boolean;
  duration?: string;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
  call?: {
    type?: string;
    duration?: string;
  }
}