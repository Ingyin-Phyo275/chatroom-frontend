export interface GetAllMessage {
   id: number | string;
    sender?: { id: number | string, username: string };
    receiver?: { id: number | string, username: string };
    content?: string;
    created_at?: string;
    attachment_url?: string | null;
    is_delivered?: boolean;
    is_pinned?: boolean;
    is_group?: boolean;
}