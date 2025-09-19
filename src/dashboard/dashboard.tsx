import { AppSidebar } from "@/components/app-sidebar";
import ChatRoom from "@/components/chatroom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useState } from "react";
import type { ChatUserType } from "@/dto/UserTypes";
import { Info, Phone, Video } from "lucide-react";

export default function Dashboard() {
  const [selectedUser, setSelectedUser] = useState<ChatUserType | null>(null);

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
        <div className="flex-1 flex flex-col  max-h-screen">
          <SidebarInset>
            {/* <header className="flex sticky bg-white top-0 z-50 h-16 items-center gap-2 px-4 border-b dark:border-slate-700">
              <SidebarTrigger />
              <span className="text-gray-500">Inbox</span>
            </header> */}
            <header className="flex sticky bg-white top-0 z-50 h-16 items-center justify-between px-4 border-b dark:border-slate-700">
              {/* Left: Sidebar trigger */}
              <div className="flex items-center gap-2">
                <SidebarTrigger />
              </div>

              {/* Center: User avatar + name + status */}
              {selectedUser && (
                <div className="flex items-center gap-3">
                  <div
                    className={`relative w-10 h-10 ${
                      selectedUser.status === "online"
                        ? "ring-2 ring-green-500"
                        : ""
                    } rounded-full`}
                  >
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{selectedUser.username}</span>
                    <span
                      className={`text-xs ${
                        selectedUser.status === "online"
                          ? "text-green-500"
                          : "text-gray-400 dark:text-gray-300"
                      }`}
                    >
                      {selectedUser.status === "online" ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              )}

              {/* Right: Phone icon */}
              {
                selectedUser && (              <div>
                <button className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                  <Phone className="w-5 h-5 text-primary" />
                </button>
                <button className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                  <Video className="w-5 h-5 text-primary" />
                </button>
                <button className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                  <Info className="w-5 h-5 text-primary" />
                </button>
              </div>)
              }
            </header>

            {/* Chat Room */}
            <div className="flex-1">
              {selectedUser ? (
                <ChatRoom user={selectedUser} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Select a user to start chatting
                </div>
              )}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
