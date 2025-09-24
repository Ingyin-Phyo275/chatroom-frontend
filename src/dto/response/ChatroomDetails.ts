import type { ChatRoomMembers } from "./ChatRoomMembers";
import type { loginResponse } from "./LoginResponse";
export interface Message {
    id: number,
    sender: loginResponse,
    content: string,
    attachemnt_url: string,
    is_delivered: boolean,
    reads: string[],
    is_pinned: boolean
}
export interface ChatroomDetails{
    id: number,
    name: string,
    is_group: boolean,
    members: ChatRoomMembers[],
    message: Message[]
}