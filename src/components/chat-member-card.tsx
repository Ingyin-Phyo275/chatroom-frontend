import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as Avatar from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { Button } from "./ui/button";
import { removeMembers } from "../http/api/removeMember";

interface User {
  id: string;
  username?: string;
  avatar_url?: string;
  status?: string;
}

interface ChatMember {
  id: string;
  role: string;
  user?: User;
}

interface ChatMembersCardProps {
  chatMembers: ChatMember[];
  chatroomId?: string
}

export default function ChatMembersCard({ chatMembers, chatroomId }: ChatMembersCardProps) {
  console.log("chatMembers", chatMembers);

  const handleRemoveMember = (memberId: string) => {
    const response = removeMembers({ chatroomId: chatroomId!, userIds: [memberId] });
    console.log("Remove member", response);
  };

  const adminMembers = chatMembers.filter((member) => member.role === "owner");

  return (
    <Tabs defaultValue="all">
      <Card className="w-full max-w-md mx-auto mt-4 bg-secondary">
        <TabsList className="flex justify-center items-center mx-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        {/* All Members */}
        <TabsContent value="all">
          <CardContent
            className="flex flex-col gap-3 overflow-y-auto"
            style={{ height: "calc((100vh - 4rem) / 3)" }}
          >
            {chatMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
              >
                {/* Left: Avatar + Name/Status */}
                <div className="flex items-center gap-3">
                  <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                    {member.user?.avatar_url ? (
                      <Avatar.Image
                        src={member.user.avatar_url}
                        alt={member.user.username}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : null}
                    <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                      {member.user?.username?.slice(0, 2).toUpperCase() || "U"}
                    </Avatar.Fallback>
                  </Avatar.Root>

                  <div className="flex flex-col">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {member.user?.username || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {member.user?.status || "No status"}
                    </p>
                  </div>
                </div>

                {/* Right: Dropdown Menu */}
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
                      <EllipsisVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                      <DropdownMenuItem>
                        <Button variant="link" onClick={() => handleRemoveMember(member.id)}>
                          Remove
                        </Button>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Set as admin</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </CardContent>
        </TabsContent>

        {/* Admin Members */}
        <TabsContent value="admins">
          <CardContent
            className="flex flex-col gap-3 overflow-y-auto"
            style={{ height: "calc((100vh - 4rem) / 3)" }}
          >
            {adminMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
              >
                {/* Avatar */}
                <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                  {member.user?.avatar_url ? (
                    <Avatar.Image
                      src={member.user.avatar_url}
                      alt={member.user.username}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : null}
                  <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                    {member.user?.username?.slice(0, 2).toUpperCase() || "U"}
                  </Avatar.Fallback>
                </Avatar.Root>

                {/* Name and Status */}
                <div className="flex flex-col">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {member.user?.username || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.user?.status || "Unknown"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </TabsContent>
      </Card>
    </Tabs>
  );
}
