import { ArrowLeft, Info, Phone, Video } from "lucide-react"
import type { ChatUserType } from "../dto/UserTypes"
import { Button } from "./ui/button"
import { SidebarTrigger } from "./ui/sidebar"
import { useState } from "react"
import ChatInfoPanel from "./chat-info-panel"
import type { loginResponse } from "../dto/response/LoginResponse"
import * as Avatar from "@radix-ui/react-avatar";
import ChatRoom from "../chatroom"
import GroupChatRoom from "./groupChatroom"
import GroupCall from "./groupCall/GroupCall"

type chatroomPageProps = {
    selectedUser: ChatUserType,
    loginUser: loginResponse
}
export default function ChatroomPage({ selectedUser, loginUser }: chatroomPageProps) {
    const [showInfo, setShowInfo] = useState(false);
    const [showGroupCall, setShowGroupCall] = useState(false);

    return (
        <>
            <header className="flex sticky top-0 z-50 h-16 items-center justify-between px-4 border-b dark:border-slate-700">
                {/* Sidebar trigger */}
                <div className="flex items-center gap-2">
                    <SidebarTrigger />
                </div>

                {/* Center: User avatar + name + status */}
                {selectedUser && (
                    <div className="flex items-center gap-3 max-md:hidden">
                        <div className={` relative w-10 h-10 ${selectedUser.status === "online"
                            ? "ring-2 ring-green-500"
                            : ""
                            } rounded-full`}>
                            <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                                {selectedUser.avatar_url ? (
                                    <Avatar.Image
                                        src={selectedUser.avatar_url}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : null}
                                <Avatar.Fallback className="w-full h-full rounded-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                                    {selectedUser.username.slice(0, 2).toUpperCase()}
                                </Avatar.Fallback>
                            </Avatar.Root>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium">{selectedUser.username}</span>
                            <span className={`text-xs ${selectedUser.status === "online"
                                ? "text-green-500"
                                : "text-gray-400 dark:text-gray-300"
                                }`}>
                                {selectedUser.status === "online" ? "Online" : "Offline"}
                            </span>
                        </div>
                    </div>
                )}

                {/* Right: info buttons */}
                {selectedUser && (
                    <div>
                        <Button
                            className="p-2 rounded"
                            variant="ghost"
                            onClick={() => setShowGroupCall(true)}
                        >
                            <Phone className="w-6 h-6 text-primary" />
                        </Button>

                        <Button
                            className="p-2 rounded"
                            variant="ghost"
                            onClick={() => setShowGroupCall(true)} // can use for video call too
                        >
                            <Video className="w-5 h-5 text-primary" />
                        </Button>

                        <Button
                            className="p-2 rounded"
                            variant={"ghost"}
                            onClick={() => setShowInfo((prev) => !prev)} // toggle info panel
                        >
                            <Info className="w-5 h-5 text-primary" />
                        </Button>
                    </div>
                    
                )}
            </header>
            
                {showGroupCall && selectedUser && (
  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg w-full max-w-3xl h-[80vh] relative">
      <button
        className="absolute top-2 right-2 p-2 bg-gray-200 dark:bg-slate-700 rounded"
        onClick={() => setShowGroupCall(false)}
      >
        Close
      </button>

      <GroupCall
        userId={loginUser.user.id}
        chatroomId={selectedUser.id}
      />
    </div>
  </div>
)}

            {/* Chat + Info layout */}
            <div className="flex-1 flex border-l h-[calc(100vh-4rem)]">
                {/* Chat Room (desktop/tablet: normal, mobile: hidden when info is open) */}
                <div className={`flex-1 border-r lg:block ${showInfo ? "hidden lg:block" : "block"}`}>
                    {selectedUser ? (
                        selectedUser.is_group ? (
                            <GroupChatRoom user={selectedUser} loginUser={loginUser} />
                        ) : (

                            <ChatRoom user={selectedUser} loginUser={loginUser} />
                        )
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                            Select a user to start chatting
                        </div>
                    )}
                </div>

                {/*Show Info Panel (desktop: side panel, mobile: replaces chat) */}
                {showInfo && selectedUser && (
                    <div className={`h-[calc(100vh-4rem)] bg-gray-50 dark:bg-slate-800 p-4 w-full lg:w-80 lg:border-l`}>
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
    )
}
