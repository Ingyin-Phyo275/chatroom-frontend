import type { ChatUserType } from "@/dto/UserTypes";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; 

interface ChatMembersCardProps {
    chatMembers: ChatUserType[]
}
export default function ChatMembersCard({ chatMembers }: ChatMembersCardProps) {

return (
    <Card className="w-full max-w-md mx-auto mt-4 bg-secondary">
      {/* Card Header */}
      <CardHeader>
        <CardTitle className="text-lg font-semibold">All Members</CardTitle>
      </CardHeader>

      {/* Card Content - scrollable with 1/3 viewport height */}
      <CardContent
        className="flex flex-col gap-3 overflow-y-auto"
        style={{ height: "calc((100vh - 4rem) / 3)" }}
      >
        {chatMembers.map((member: ChatUserType) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-2 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
          >
            {/* Avatar */}
            <img
              src={member.avatar_url}
              alt={member.username}
              className="w-10 h-10 rounded-full object-cover"
            />

            {/* Name and Status */}
            <div className="flex flex-col">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {member.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {member.status}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
