import ChatRoom from "../../components/privateChatroom/chatroom";
import type { loginResponse } from "../../dto/response/LoginResponse";
import type { ChatUserType } from "../../dto/UserTypes";

type ChatroomProps = {
    user: ChatUserType,
    loginUser: loginResponse
}
export default function PrivateChat({ user, loginUser }: ChatroomProps) {
  return (
        <ChatRoom user={user} loginUser={loginUser}/>
  )
}
