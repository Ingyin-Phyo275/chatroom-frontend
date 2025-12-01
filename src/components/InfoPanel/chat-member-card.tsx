import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as Avatar from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { removeMembers } from "../../http/api/groupChat/removeMember";
import { toast } from "sonner";

interface User {
  id: string;
  username?: string;
  avatar_url?: string;
  status?: string;
  last_seen?: string
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

export function MemberAvatar({ member }: { member?: ChatMember }) {
  return (
    <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
      {member?.user?.avatar_url ? (
        <Avatar.Image
          src={member.user.avatar_url}
          alt={member.user.username}
          className="w-full h-full object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : null}
      <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-500 text-white font-semibold">
        {member?.user?.username?.slice(0, 2).toUpperCase() || "U"}
      </Avatar.Fallback>
    </Avatar.Root>
  );
}

export default function ChatMembersCard({ chatMembers, chatroomId }: ChatMembersCardProps) {
  const queryClient = useQueryClient();

  //console.log("check members", chatMembers)
  const handleRemoveMember = async (memberId: string) => {
    try {
      // Wait for the member to be removed
      const response = await removeMembers({
        chatroomId: Number(chatroomId!),
        userIds: [memberId]
      });

      toast.success(response?.data?.messages || "Member remove successful!")
      console.log("Invalidating key:", ["chatroomDetails", String(chatroomId)]);
      await queryClient.invalidateQueries({ queryKey: ["chatroomDetails", String(chatroomId)] });
      await queryClient.refetchQueries({ queryKey: ["chatroomDetails", String(chatroomId)] });
      console.log("Remove member", response);
    } catch (error) {
      console.error("Failed to remove member", error);
      toast.error(String(error) || "Something went wrong");
    }
  };

  const adminMembers = chatMembers.filter((member) => member.role === "owner");
  const loginUser = JSON.parse(localStorage.getItem('user')!);

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
                className="flex items-center justify-between px-3 py-2 border-b  dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
              >
                {/* Left: Avatar + Name/Status */}
                <div className="flex items-center gap-3">
                  <MemberAvatar member={member} />
                  <div className="flex flex-col">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {member.user?.id === loginUser.user.id ? member.user?.username + " (You)" : member.user?.username}
                      {/* {member.user?.username || "Unknown"} */}
                    </p>
                    {/* <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {member.user?.status === "offline" ? formatLastSeen(member?.user?.last_seen) : member?.user?.status}
                    </p> */}
                  </div>
                </div>

                {/* Right: Dropdown Menu */}
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1  hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
                      <EllipsisVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                      <DropdownMenuItem>
                        <Button variant="link" onClick={() => handleRemoveMember(member?.user?.id!)}>
                          Remove
                        </Button>
                      </DropdownMenuItem>
                      <Separator />
                      <DropdownMenuItem>
                        <Button variant="link" onClick={() => handleRemoveMember(member?.user?.id!)}>Set as Admin</Button>
                      </DropdownMenuItem>
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
                className="flex items-center gap-3 p-2 border-b  dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
              >
                {/* Avatar */}
                <MemberAvatar member={member} />
                {/* Name and Status */}
                <div className="flex flex-col">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {member.user?.id === loginUser.user.id ? member.user?.username + " (You)" : member.user?.username}
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
