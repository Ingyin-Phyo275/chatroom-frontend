import { Angry, Heart, Smile, ThumbsUp } from "lucide-react";
import type { PrivateChatMessage } from "../../dto/response/PrivateChatMessage";

type Props = {
    receiverId: string
    isOwn: boolean
    message: PrivateChatMessage
}
export default function TestReaction({
    receiverId,
    isOwn,
    message
}: Props) {
  const reactionIcons: Record<string, React.JSX.Element> = {
    smile: (
      <Smile className="w-7 h-7 bg-gray-100 p-1 rounded-full stroke-white fill-yellow-500" />
    ),
    love: (
      <Heart className="w-7 h-7 bg-gray-100 p-1 rounded-full stroke-white fill-green-500" />
    ),
    like: (
      <ThumbsUp className="w-7 h-7 bg-gray-100 p-1 rounded-full stroke-white fill-primary" />
    ),
    angry: (
      <Angry className="w-7 h-7 bg-gray-100 p-1 rounded-full stroke-white fill-red-500" />
    ),
  };
    const loginUser = JSON.parse(localStorage.getItem("user") || '{}');
    console.log("login user", loginUser?.user?.id)
    console.log("receiver", receiverId)
  return (
    <div>
                  {/* {isOwn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReactionMessageId(
                          isReactionActive ? null : message.id
                        );
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
                    >
                      {message?.reactions?.length !== 0 ? (
                        <span>{reactionIcons[emoji]}</span>
                      ) : (
                        <Heart className="w-5 h-5 bg-gray-200 p-1 rounded-full text-primary" />
                      )}
                    </button>
                  )} */}
    </div>
  )
}
