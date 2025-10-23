import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useState } from "react";
import type { ChatUserType } from "@/dto/UserTypes";
import "../../App.css";

import ChatroomPage from "../../components/chatroom-page";
import type { loginResponse } from "../../dto/response/LoginResponse";
export default function Dashboard() {
  const [selectedUser, setSelectedUser] = useState<ChatUserType | null>(null);
  const loginUser: loginResponse = JSON.parse(localStorage.getItem("user") || '{}');

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
        />
        {/* Main content */}
        <div className="flex-1 flex flex-col max-h-screen">
          <SidebarInset>
            <ChatroomPage selectedUser={selectedUser!} loginUser={loginUser} />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
