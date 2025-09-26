export interface GetAllMessage {
    id: number;
    sender: string;
    receiver: string;
    content: string;
    created_at: string;
    is_delivered: boolean;
    is_pinned: boolean;
    attachment_url: string | null;
}