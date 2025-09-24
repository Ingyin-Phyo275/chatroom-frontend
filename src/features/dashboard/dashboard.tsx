import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {  useEffect, useState } from "react";
import type { ChatUserType } from "@/dto/UserTypes";
import "../../App.css";

import ChatroomPage from "../../components/chatroom-page";
import type { loginResponse } from "../../dto/response/LoginResponse";
import { userListQuery } from "../../composables/Queries/userListQuery";
import { useGroupChatList } from "../../composables/Queries/useGroupChatList";
export default function Dashboard() {
  const [selectedUser, setSelectedUser] = useState<ChatUserType | null>(null);
  const loginUser: loginResponse = JSON.parse(localStorage.getItem("user") || '{}');
  
  //chat users
  const users = [
    { id: "1", username: "Jane", status: "online", is_group: true, tabs: "Group", avatar_url: "https://i.pinimg.com/736x/95/f1/3c/95f13c40ca7201d466c513057b551d3d.jpg" },
    { id: "2", username: "John", status: "offline", is_group: false, tabs: "Personal", avatar_url: "https://plus.unsplash.com/premium_photo-1671656349218-5218444643d8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: "3", username: "Emma", status: "online", is_group: false, tabs: "Personal", avatar_url: "https://e1.pxfuel.com/desktop-wallpaper/551/898/desktop-wallpaper-emma-watson-cute-english-actresses-for-fb-profile-english-girls.jpg" },
    { id: "4", username: "Mike", status: "offline", is_group: true, tabs: "Group", avatar_url: "https://i.pinimg.com/736x/d7/d6/68/d7d668991c8fc952ef2b9a2a03b25479.jpg" },
  ];

  const { userListData, isError, error} = userListQuery();
   const { groupChatListQuery} =  useGroupChatList();
  useEffect(() => {
   
    if (isError) {
      console.error(error);
    }
  },[isError, error]);

    // Join room when selectedUser changes
  // useEffect(() => {
  //   if (!selectedUser) return;

  //   // Create a unique room ID (sorted so it’s the same for both users)
  //   const roomId = [loginUser.user.id, selectedUser.id].sort().join("_");

  //   console.log("Joining room:", roomId);

  //   socket.emit("join_room", { roomId, userId: loginUser.user.id });

  //   // Optional: listen for server confirmation
  //   const handleRoomJoined = (data: any) => {
  //     console.log("✅ Joined room:", data.roomId);
  //   };

  //   socket.on("room_joined", handleRoomJoined);

  //   return () => {
  //     socket.off("room_joined", handleRoomJoined);
  //   };
  // }, [selectedUser]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-mobile": "20rem",
        } as React.CSSProperties
      }
    >
      <div className="flex h-screen w-screen">
        {/* Sidebar */}
<AppSidebar
  selectedUser={selectedUser}
  onSelectUser={setSelectedUser}
  users={users}
  contact={userListData ?? []}
  groupsChats={groupChatListQuery ?? []}   // ✅ match AppSidebar props
/>


        {/* Main content */}
        <div className="flex-1 flex flex-col max-h-screen">
          <SidebarInset>
            <ChatroomPage selectedUser={selectedUser!} loginUser={loginUser}/>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
