export interface UserListResponse {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
    phone_no?: string;
    status?: boolean | "Offline";
    is_group: false;
    unreadCount?: number
}