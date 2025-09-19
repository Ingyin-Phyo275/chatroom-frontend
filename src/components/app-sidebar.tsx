"use client";

import * as React from "react";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import ChatUsers from "./chatusers";
import type { ChatUserType } from "@/dto/UserTypes";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  users: [
    { id: "jane", username: "Jane", status: "online", tabs: "Group", avatar_url: "https://i.pinimg.com/736x/95/f1/3c/95f13c40ca7201d466c513057b551d3d.jpg" },
    { id: "john", username: "John", status: "offline", tabs: "Personal", avatar_url: "https://plus.unsplash.com/premium_photo-1671656349218-5218444643d8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: "emma", username: "Emma", status: "online", tabs: "Personal", avatar_url: "https://e1.pxfuel.com/desktop-wallpaper/551/898/desktop-wallpaper-emma-watson-cute-english-actresses-for-fb-profile-english-girls.jpg" },
    { id: "mike", username: "Mike", status: "offline", tabs: "Group", avatar_url: "https://i.pinimg.com/736x/d7/d6/68/d7d668991c8fc952ef2b9a2a03b25479.jpg" },
  ],
};

export function AppSidebar({
  selectedUser,
  onSelectUser,
  ...props
}: {
  selectedUser: ChatUserType | null
  onSelectUser: (user: ChatUserType) => void
} & React.ComponentProps<typeof Sidebar>) {
  const [tabs, setTabs] = React.useState("All");
  const tabList = ["All", "Personal", "Group", "Contacts"];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="flex items-center justify-center w-full">
        <div className="border-b border-gray-200 dark:border-gray-700 text-sm w-full text-center">
          <ul className="flex h-12 items-center -mb-px">
            {" "}
            {tabList.map((tab) => (
              <li key={tab} className="mr-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setTabs(tab);
                  }}
                  className={`inline-block p-2 border-b-2 rounded-t-lg cursor-pointer ${
                    tabs === tab
                      ? "border-primary text-primary dark:text-blue-500 dark:border-blue-500"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                >
                  {tab}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ChatUsers
          users={data.users}
          tabs={tabs}
          onSelectUser={onSelectUser} // now updates Dashboard state
        />
        {/* <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter className="bg-primary-foreground rounded-2xl">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
