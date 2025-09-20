export interface Message {
    chatroom_id: string;
    sender_id: string;
    content: string;
    attachment_url?: string;
    is_delivered: boolean;
    is_read: boolean;
    is_pinned: boolean;
}