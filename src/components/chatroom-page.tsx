// ChatroomPage.tsx
import { ArrowLeft, Info, Phone, Video, X } from "lucide-react";
import type { ChatUserType } from "../dto/UserTypes";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { useState } from "react";
import ChatInfoPanel from "./chat-info-panel";
import type { loginResponse } from "../dto/response/LoginResponse";
import * as Avatar from "@radix-ui/react-avatar";
import ChatRoom from "../chatroom";
import GroupChatRoom from "./groupChatroom";
import GroupCall from "./groupCall/GroupCall";
import formatLastSeen from "@/utils/helper";

type chatroomPageProps = {
  selectedUser: ChatUserType;
  loginUser: loginResponse;
};

export default function ChatroomPage({ selectedUser, loginUser }: chatroomPageProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [showGroupCall, setShowGroupCall] = useState(false);
  return (
    <>
      {/* Header */}
      <header className="flex sticky top-0 z-50 h-16 items-center justify-between px-4 border-b dark:border-slate-700 bg-white dark:bg-slate-900">
        {/* Sidebar trigger */}
        <div className="flex items-center gap-2">
          <SidebarTrigger />
        </div>

        {/* Center: User avatar + name + status */}
        {selectedUser && (
          <div className="flex items-center gap-3 max-md:hidden">
            <div className={`relative w-10 h-10 ${selectedUser.status === "online" ? "ring-2 ring-green-500" : ""} rounded-full`}>
              <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                {selectedUser.avatar_url ? (
                  <Avatar.Image src={selectedUser.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-500 text-white font-semibold rounded-full">
                    {selectedUser.username.slice(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                )}
              </Avatar.Root>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{selectedUser.username}</span>
              <span className={`text-xs ${selectedUser.status === "online" ? "text-green-500" : "text-gray-400 dark:text-gray-300"}`}>
                {selectedUser.status === "online" ? "Online" : formatLastSeen(selectedUser?.last_seen)}
              </span>
            </div>
          </div>
        )}

        {/* Right: info buttons */}
        {selectedUser && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="p-2 rounded" onClick={() => setShowGroupCall(true)}>
              <Phone className="w-6 h-6 text-primary" />
            </Button>
            <Button variant="ghost" className="p-2 rounded" onClick={() => setShowGroupCall(true)}>
              <Video className="w-5 h-5 text-primary" />
            </Button>
            <Button variant="ghost" className="p-2 rounded" onClick={() => setShowInfo((prev) => !prev)}>
              <Info className="w-5 h-5 text-primary" />
            </Button>
          </div>
        )}
      </header>

      {/* Group Call Modal */}
{showGroupCall  && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Blurred Background */}
    <div
      className="absolute inset-0 bg-transparent bg-opacity-30 dark:bg-black dark:bg-opacity-50 backdrop-blur-sm"
      onClick={() => setShowGroupCall(false)} 
    ></div>

    {/* Modal */}
    <div className="relative w-full max-w-3xl h-[80vh] bg-white/80 dark:bg-slate-800/80 rounded-lg shadow-lg overflow-hidden backdrop-blur-md animate-fade-in">
      {/* Close Button */}
<button
  className="absolute cursor-pointer top-3 right-3 p-2 bg-gray-200/70 dark:bg-slate-700/70 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
  onClick={() => setShowGroupCall(false)}
>
  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
</button>
      {/* GroupCall Component */}
      <div className="w-full h-full p-4 overflow-hidden">
        <GroupCall userId={loginUser.user.id} chatroomId={selectedUser.id} autoStart="audio" setShowGroupCall={setShowGroupCall}  />
      </div>
    </div>
  </div>
)}
      {/* Chat + Info layout */}
      <div className="flex-1 flex border-l h-[calc(100vh-4rem)]">
        {/* Chat Room */}
        <div className={`flex-1 border-r lg:block ${showInfo ? "hidden lg:block" : "block"}`}>
          {selectedUser ? (
            selectedUser.is_group ? (
              <GroupChatRoom user={selectedUser} loginUser={loginUser}  key={`group-${selectedUser.id}`}  />
            ) : (
              <ChatRoom user={selectedUser} loginUser={loginUser} key={`private-${selectedUser?.id}`}/>
            )
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Select a user to start chatting
            </div>
          )}
        </div>

        {/* Info Panel */}
        {showInfo && selectedUser && (
          <div className="h-[calc(100vh-4rem)]  dark:bg-slate-800 p-4 w-full lg:w-90 lg:border-l">
            {/* Back button for mobile */}
            <div className="flex items-center mb-4 lg:hidden">
              <Button variant="ghost" onClick={() => setShowInfo(false)} className="mr-2">
                <ArrowLeft />
              </Button>
            </div>

            {/* Info content */}
            <ChatInfoPanel selectedUser={selectedUser} />
          </div>
        )}
      </div>
    </>
  );
}
