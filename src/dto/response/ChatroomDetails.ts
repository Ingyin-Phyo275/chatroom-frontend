import type { ChatRoomMembers } from "./ChatRoomMembers";

export interface Message {
    id: string | number;
    sender: { id: string | number, username: string };   // just the id, not full loginResponse
    receiver?: { id: string | number, username: string }; // optional if group chat
    content: string;
    created_at: string;
    attachment_url?: string | null;     // fix typo
    is_delivered?: boolean;
    is_pinned?: boolean;
    reads?: string[];
}

export interface ChatroomDetails{
    id: number,
    name: string,
    is_group: boolean,
    members: ChatRoomMembers[],
    messages: Message[]
}