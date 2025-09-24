import type { loginResponse } from "./LoginResponse";

export interface ChatRoomMembers {
    id: number,
    user: loginResponse,
    role: string
}