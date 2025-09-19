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
import { Button } from "../components/ui/button";

export default function Dashboard() {
  const [selectedUser, setSelectedUser] = useState<ChatUserType | null>(null);
  const [showInfo, setShowInfo] = useState(false); // <-- controls info panel

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
                      {selectedUser.status === "online"
                        ? "Online"
                        : "Offline"}
                    </span>
                  </div>
                </div>
              )}

              {/* Right: Action buttons */}
              {selectedUser && (
                <div>
                  <Button className="p-2 rounded" variant={"ghost"}>
                    <Phone className="w-6 h-6 text-primary" />
                  </Button>
                  <Button className="p-2 rounded" variant={"ghost"}>
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

            {/* Chat + Info layout */}
            <div className="flex-1 flex">
              {/* Chat Room */}
              <div className={`flex-1 ${showInfo ? "border-r" : ""}`}>
                {selectedUser ? (
                  <ChatRoom user={selectedUser} />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    Select a user to start chatting
                  </div>
                )}
              </div>

              {/* Info Panel (new column) */}
              {showInfo && selectedUser && (
                <div className="w-80 border-l bg-gray-50 dark:bg-slate-800 p-4">
                  <h2 className="font-semibold text-lg mb-2 text-center">User Info</h2>
                  <div className="flex flex-col items-center">
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.username}
                      className="w-20 h-20 rounded-full object-cover mb-3"
                    />
                    <p className="font-medium">{selectedUser.username}</p>
                    <p
                      className={`text-sm ${
                        selectedUser.status === "online"
                          ? "text-green-500"
                          : "text-gray-400 dark:text-gray-300"
                      }`}
                    >
                      {selectedUser.status === "online"
                        ? "Online"
                        : "Offline"}
                    </p>
                  </div>
                  {/* Additional details */}
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    <p>Email: {selectedUser.username ?? "N/A"}</p>
                    <p>Joined: {selectedUser.tabs ?? "Unknown"}</p>
                  </div>
                </div>
              )}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
