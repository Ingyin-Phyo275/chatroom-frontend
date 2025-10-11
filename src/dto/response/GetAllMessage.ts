export interface GetAllMessage {
   id: number | string;
    sender?: { id: number | string, username: string };
    chatroom?: { id: number | string, username: string };
    content?: string;
    created_at?: string;
    attachment_url?: string[] | null;
      attachment_urls?: string[] | null; 
      attachment_type?: string | null;
      attachment_types?: string[] | undefined;
        imagePath?: string[] | null;
        imagePaths?: string[] | null;
    is_delivered?: boolean;
    is_pinned?: boolean;
    is_group?: boolean;
}