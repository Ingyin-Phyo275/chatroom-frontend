import GroupChatRoom from "../../components/groupChatroom/groupChatroom";
import type { loginResponse } from "../../dto/response/LoginResponse";
import type { ChatUserType } from "../../dto/UserTypes";

type Props = { user: ChatUserType; loginUser: loginResponse; key: string };

export default function GroupChat({ user, loginUser }: Props) {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative">
        <GroupChatRoom user={user} loginUser={loginUser}/>
    </div>
  )
}
