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
import type { UserListResponse } from "../dto/response/UserListResponse";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import MemberAddForm from "./member-add-form";
import { Dialog, DialogClose, DialogContent, DialogHeader } from "./ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { CirclePlus } from "lucide-react";
import type { GroupChatResponse } from "../dto/response/ChatRoom";
export function AppSidebar({
  selectedUser,
  onSelectUser,
  users,
  contact,
  groupsChats,
  ...props
}: {
  selectedUser: ChatUserType | null
  onSelectUser: (user: ChatUserType) => void
  users: ChatUserType[]
  contact: UserListResponse[]
  groupsChats: GroupChatResponse[]
} & React.ComponentProps<typeof Sidebar>) {
  const [tabs, setTabs] = React.useState("Contacts");
  const tabList = ["Contacts", "All", "Personal", "Group"];
  const [isOpen, setIsOpen] = React.useState(false);
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
      <SidebarHeader className="flex items-center justify-center w-full mx-auto">
        <div className="border-b border-gray-200 dark:border-gray-700 text-sm w-full text-center">
          <div className=" flex items-center justify-between gap-5">

            <h1 className="text-2xl font-semibold">Chats</h1>
            {/* <Button
              variant="ghost"
              size="icon"
              className="bg-primary rounded-full"
            >
              <CirclePlus className="h-6 w-6 text-white" />
            </Button> */}
            {/* Dropdown Menu */}
 {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className=" bg-blue-500 text-white rounded-full hover:bg-blue-600 transition">
            <CirclePlus className="h-6 w-6" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setIsOpen(true)}>Create Group</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal/Dialog for MemberAddForm */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-auto rounded-lg p-6 bg-white">
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <MemberAddForm contacts={contact} />
          </div>

          <div className="mt-4 flex justify-end">
            <DialogClose className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">
              Close
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
          </div>
          <ul className="flex h-12 gap-2 items-center -mb-px justify-center">
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
        <ChatUsers groupsChats={groupsChats} contact={contact} users={users} tabs={tabs} onSelectUser={onSelectUser} />
      </SidebarContent>
      <SidebarFooter className="bg-primary rounded-2xl">
        {loginUser && <NavUser user={loginUser} />}
      </SidebarFooter>

    </Sidebar>


  );
}
