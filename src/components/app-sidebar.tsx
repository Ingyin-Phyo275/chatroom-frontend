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
import { Input } from "./ui/input";
import { SearchIcon } from "lucide-react";
// import { NavMain } from "./navmain";
// import { AudioWaveform, BookOpen, Bot, Command, GalleryVerticalEnd, Settings2, SquareTerminal } from "lucide-react";

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
  //   const data = {
  //   user: {
  //     name: "shadcn",
  //     email: "m@example.com",
  //     avatar: "/avatars/shadcn.jpg",
  //   },
  //   teams: [
  //     {
  //       name: "Acme Inc",
  //       logo: GalleryVerticalEnd,
  //       plan: "Enterprise",
  //     },
  //     {
  //       name: "Acme Corp.",
  //       logo: AudioWaveform,
  //       plan: "Startup",
  //     },
  //     {
  //       name: "Evil Corp.",
  //       logo: Command,
  //       plan: "Free",
  //     },
  //   ],
  //   navMain: [
  //     {
  //       title: "Playground",
  //       url: "#",
  //       icon: SquareTerminal,
  //       isActive: true,
  //       items: [
  //         {
  //           title: "History",
  //           url: "#",
  //         },
  //         {
  //           title: "Starred",
  //           url: "#",
  //         },
  //         {
  //           title: "Settings",
  //           url: "#",
  //         },
  //       ],
  //     },
  //     {
  //       title: "Models",
  //       url: "#",
  //       icon: Bot,
  //       items: [
  //         {
  //           title: "Genesis",
  //           url: "#",
  //         },
  //         {
  //           title: "Explorer",
  //           url: "#",
  //         },
  //         {
  //           title: "Quantum",
  //           url: "#",
  //         },
  //       ],
  //     },
  //     {
  //       title: "Documentation",
  //       url: "#",
  //       icon: BookOpen,
  //       items: [
  //         {
  //           title: "Introduction",
  //           url: "#",
  //         },
  //         {
  //           title: "Get Started",
  //           url: "#",
  //         },
  //         {
  //           title: "Tutorials",
  //           url: "#",
  //         },
  //         {
  //           title: "Changelog",
  //           url: "#",
  //         },
  //       ],
  //     },
  //     {
  //       title: "Settings",
  //       url: "#",
  //       icon: Settings2,
  //       items: [
  //         {
  //           title: "General",
  //           url: "#",
  //         },
  //         {
  //           title: "Team",
  //           url: "#",
  //         },
  //         {
  //           title: "Billing",
  //           url: "#",
  //         },
  //         {
  //           title: "Limits",
  //           url: "#",
  //         },
  //       ],
  //     },
  //   ],
  // }
  const [tabs, setTabs] = React.useState("All");
  const tabList = ["All", "Personal", "Group"];

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

const [searchTerm, setSearchTerm] = React.useState("");

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchTerm(e.target.value);
};

const filteredUsers = users.filter((user) =>
  user.username.toLowerCase().includes(searchTerm.toLowerCase())
);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="flex items-center justify-center w-full mx-auto">
        <div className="border-b border-gray-200 dark:border-gray-700 text-sm w-full text-center">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-9 pr-3"

            />
          </div>
          <ul className="flex h-12 gap-4 items-center -mb-px justify-center">
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
      <ChatUsers users={filteredUsers} tabs={tabs} onSelectUser={onSelectUser} />

        {/* <NavMain items={data.navMain} /> */}
        {/* <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter className="bg-primary-foreground rounded-2xl">
        {loginUser && <NavUser user={loginUser} />}
      </SidebarFooter>

    </Sidebar>
  );
}
