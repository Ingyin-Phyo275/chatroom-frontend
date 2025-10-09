export interface PrivateChatMessage {
 id: string;
  sender: string | { id?: number | string; username?: string } | any; // sometimes object depending on api
  receiver?: string | { id?: number | string; username?: string } | any;
  content: string;
  created_at: string;
  is_delivered?: boolean;
  is_pinned?: boolean;
  attachment_url?: string | null;
 attachment_urls?: string[] | null; 
  imagePath?: string | null;
  imagePaths?: string[] | null;
  attachmentType?: "image" | "video" | "audio" | "file" | null;
  attachmentTypes?: ("image" | "video" | "audio" | "file")[] | null;
  is_group?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
  }
}