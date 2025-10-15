export interface GroupChatResponse {
    id: string;
    name: string;
    is_group: string;
    unreadCount?: number;
    last_seen?: string
}