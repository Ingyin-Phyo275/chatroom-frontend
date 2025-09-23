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

// const data = {
//   user: {
//     name: "shadcn",
//     email: "m@example.com",
//     avatar: "/avatars/shadcn.jpg",
//   },
// };

export function AppSidebar({
  selectedUser,
  onSelectUser,
  users,
  ...props
}: {
  selectedUser: ChatUserType | null
  onSelectUser: (user: ChatUserType) => void
  users: ChatUserType[]
} & React.ComponentProps<typeof Sidebar>) {
  const [tabs, setTabs] = React.useState("All");
  const tabList = ["All", "Personal", "Group", "Contacts"];

  const loginUserString = localStorage.getItem("user");
  let loginUser: {
    name: string;
    email: string;
    phone_no?: string;
    avatar?: string;
    status?: boolean;
  } | null = null;

  if (loginUserString) {
    try {
      const parsed = JSON.parse(loginUserString);
      loginUser = parsed.user ?? null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    }
  }

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
                  className={`inline-block p-2 border-b-2 rounded-t-lg cursor-pointer ${tabs === tab
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
          users={users}
          tabs={tabs}
          onSelectUser={onSelectUser}
        />
        {/* <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter className="bg-primary-foreground rounded-2xl">
        {loginUser && <NavUser user={loginUser} />}
      </SidebarFooter>

    </Sidebar>
  );
}
