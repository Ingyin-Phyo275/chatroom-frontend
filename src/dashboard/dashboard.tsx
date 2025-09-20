import { AppSidebar } from "@/components/app-sidebar";
import ChatRoom from "@/components/chatroom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useState } from "react";
import type { ChatUserType } from "@/dto/UserTypes";
import { ArrowLeft, Info, Phone, Video } from "lucide-react";
import { Button } from "../components/ui/button";
import "../App.css";
import ChatInfoPanel from "@/components/chat-info-panel";
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
                <div className="flex items-center gap-3 max-lg:hidden">
                  <div
                    className={` relative w-10 h-10 ${
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
            <div className="flex-1 flex border-l h-[calc(100vh-4rem)]">
              {/* Chat Room (desktop/tablet: normal, mobile: hidden when info is open) */}
              <div
                className={`flex-1 border-r lg:block ${
                  showInfo ? "hidden lg:block" : "block"
                }`}
              >
                {selectedUser ? (
                  <ChatRoom user={selectedUser} />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    Select a user to start chatting
                  </div>
                )}
              </div>

              {/* Info Panel (desktop: side panel, mobile: replaces chat) */}
              {showInfo && selectedUser && (
                <div
                  className={`h-[calc(100vh-4rem)] bg-gray-50 dark:bg-slate-800 p-4 w-full lg:w-80 lg:border-l`} // full width on mobile, sidebar on desktop
                >
                  {/* Back button for mobile */}
                  <div className="flex items-center mb-4 lg:hidden">
                    <Button
                      variant="ghost"
                      onClick={() => setShowInfo(false)}
                      className="mr-2"
                    >
                      <ArrowLeft />
                    </Button>
                  </div>

                  {/* Info content */}
                  <ChatInfoPanel selectedUser={selectedUser} />
                </div>
              )}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
