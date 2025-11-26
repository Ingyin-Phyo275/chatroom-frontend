import { ArrowLeft, Info, Phone, Pin, Video, X } from "lucide-react";
import type { ChatUserType } from "../dto/UserTypes";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { useState, useEffect } from "react";
import ChatInfoPanel from "./chat-info-panel";
import type { loginResponse } from "../dto/response/LoginResponse";
import * as Avatar from "@radix-ui/react-avatar";
import GroupCall from "./groupCall/GroupCall";
import formatLastSeen from "@/utils/helper";
import { socket } from "@/socket/socket";
import PrivateCall from "./privateCall/PrivateCall";
import { toast } from "sonner";
import { getPinnedMessage } from "../http/api/privateChat/getPinnedMessage";
import PinnedActionMenu from "./PinnedActionMenu";
import { getGroupPinnedMessage } from "../http/api/groupChat/getGroupPinnedMessage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // make sure this is the correct import path
import type { PrivateCallResponse } from "../dto/response/PrivateCallResponse";
import PrivateChat from "../features/PrivateChat/PrivateChat";
import GroupChat from "../features/GroupChat/GroupChat";

type chatroomPageProps = {
  selectedUser: ChatUserType;
  loginUser: loginResponse;
};

export default function ChatroomPage({ selectedUser, loginUser }: chatroomPageProps) {
  const [showInfo, setShowInfo] = useState(false);

  // Separate states for group & private calls
  const [showGroupCall, setShowGroupCall] = useState(false);
  const [showPrivateCall, setShowPrivateCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [incomingFromUser, setIncomingFromUser] = useState<any>(null); // store sender data
  const [pendingOffer, setPendingOffer] = useState<any>(null); // Store webrtc-offer before component mounts

  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);

  console.log(showPinnedModal);
  // Listen globally for incoming group calls
  useEffect(() => {
    const handleIncomingGroupCall = (payload: any) => {
      const data = Array.isArray(payload) ? payload[0] : payload;

      if (data.initiatorId === loginUser.user.id) return;

      setIncomingCall({
        callId: data.callId,
        chatroomId: data.chatroomId,
        initiatorId: data.initiatorId,
        initiatorName: data.initiatorName,
        chatroomName: data.chatroomName,
        type: data.type,
        timestamp: data.timestamp,
      });
      setShowGroupCall(true);
    };

    socket.on("incoming-group-call", handleIncomingGroupCall);
    return () => {
      socket.off("incoming-group-call", handleIncomingGroupCall);
    };
  }, [loginUser.user.id]);

  //  Global listener for incoming private calls (even if no chat selected)
  useEffect(() => {
    const handleIncomingPrivateCall = (payload: PrivateCallResponse) => {
      const data = Array.isArray(payload) ? payload[0] : payload;
      console.log("Incoming private call:", data);

      if (data.from === loginUser.user.id) return;

      // store sender info (useful when selectedUser is null)
      setIncomingFromUser(data.fromUser || data.from_user || data.from);

      setIncomingCall({
        callId: data.callData?.id,
        from: data.from,
        call_type: data.call_type,
        callData: data.callData,
      });

      setShowPrivateCall(true);
    };

    socket.on("private-incoming-call", handleIncomingPrivateCall);
    return () => {
      socket.off("private-incoming-call", handleIncomingPrivateCall);
    };
  }, [loginUser.user.id]);

  // 🔧 FIX: Global listener for webrtc-offer (may arrive before PrivateCall mounts)
  useEffect(() => {
    const handleWebRTCOffer = (payload: any) => {
      const data = Array.isArray(payload) ? payload[0] : payload;
      console.log("📞 [CHATROOM-PAGE] Caught webrtc-offer globally:", data);

      if (data.from === loginUser.user.id) {
        console.log("⚠️ Ignoring own offer");
        return;
      }

      // Store the offer so PrivateCall component can use it when it mounts
      setPendingOffer(data);
    };

    socket.on("webrtc-offer", handleWebRTCOffer);
    return () => {
      socket.off("webrtc-offer", handleWebRTCOffer);
    };
  }, [loginUser.user.id]);

  const isGroup = selectedUser?.is_group === true;
  // Handle pin message
  const handlePinMessage = async () => {
    try {
      const response = isGroup ? await getGroupPinnedMessage(selectedUser.id) : await getPinnedMessage(selectedUser.id);
      console.log("Pinned message response data:", response);
      setPinnedMessages(response || []);
      setShowPinnedModal(true);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching pinned messages");
    }
  };

  //handle unpin message
  const handleUnpinMessage = async (messageId: number) => {
    try {
      if (isGroup) {
        socket.emit("group-message-pin", { messageId, isPinned: false, receiverId: Number(selectedUser.id) });
      }
      socket.emit("message-pin", { messageId, isPinned: false, receiverId: Number(selectedUser.id) });
      setPinnedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success("Message unpinned successfully");
    } catch (error) {
      console.error("Error unpinning message:", error);
      toast.error("Failed to unpin message");
    }
  };
  //console.log("pinned message", pinnedMessages)
  return (
    <>
      {/* Header */}
      <header className="flex sticky top-0 z-50 h-16 items-center justify-between px-4 border-b dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
        </div>

        {selectedUser && (
          <div className="flex items-center gap-3 max-md:hidden">
            <div
              className={`relative w-10 h-10 ${selectedUser.status === "online" ? "ring-2 ring-green-500" : ""
                } rounded-full`}
            >
              <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                {selectedUser.avatar_url ? (
                  <Avatar.Image
                    src={selectedUser.avatar_url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-500 text-white font-semibold rounded-full">
                    {selectedUser.username.slice(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                )}
              </Avatar.Root>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{selectedUser.username}</span>
              <span
                className={`text-xs ${selectedUser.status === "online"
                  ? "text-green-500"
                  : "text-gray-400 dark:text-gray-300"
                  }`}
              >
                {selectedUser.status === "online"
                  ? "Online"
                  : formatLastSeen(selectedUser?.last_seen)}
              </span>
            </div>
          </div>
        )}

        {selectedUser && (
          <div className="flex items-center gap-2">
            <DropdownMenu
              onOpenChange={(isOpen) => {
                if (isOpen) handlePinMessage();
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-2 rounded">
                  <Pin className="w-6 h-6 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-0">
                <DropdownMenuLabel className="px-4 py-2 border-b border-gray-100 dark:border-slate-700  flex items-center gap-2">
                  📌 Pinned Messages
                </DropdownMenuLabel>

                {pinnedMessages.length > 0 ? (
                  pinnedMessages.map((msg) => (
                    <DropdownMenuItem
                      key={msg.id}
                      className="flex justify-between items-start gap-2 py-2 px-4 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-200">{msg.content}</p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          From: {msg.sender?.username}
                        </span>
                      </div>

                      <PinnedActionMenu
                        messageId={msg.id}
                        onUnpin={() => handleUnpinMessage(msg.id)}
                      />
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem className="text-sm text-gray-500 dark:text-gray-400 cursor-default">
                    No pinned messages found
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Other buttons (Phone, Video, Info) */}
            <Button
              variant="ghost"
              className="p-2 rounded"
              onClick={() => {
                setIncomingCall(null);
                selectedUser.is_group ? setShowGroupCall(true) : setShowPrivateCall(true);
              }}
            >
              <Phone className="w-6 h-6 text-primary" />
            </Button>

            <Button
              variant="ghost"
              className="p-2 rounded"
              onClick={() => {
                setIncomingCall(null);
                selectedUser.is_group ? setShowGroupCall(true) : setShowPrivateCall(true);
              }}
            >
              <Video className="w-5 h-5 text-primary" />
            </Button>

            <Button
              variant="ghost"
              className="p-2 rounded"
              onClick={() => setShowInfo((prev) => !prev)}
            >
              <Info className="w-5 h-5 text-primary" />
            </Button>
          </div>
        )}

      </header>

      {/* Group Call Modal */}
      {showGroupCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-transparent bg-opacity-30 dark:bg-black dark:bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          ></div>

          <div className="relative w-full max-w-3xl h-[80vh] bg-white/80 dark:bg-slate-800/80 rounded-lg shadow-lg overflow-hidden backdrop-blur-md animate-fade-in">
            <button
              className="absolute cursor-pointer top-3 right-3 p-2 bg-gray-200/70 dark:bg-slate-700/70 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              onClick={() => setShowGroupCall(false)}
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="w-full h-full p-4 overflow-hidden">
              <GroupCall
                userId={Number(loginUser.user.id)}
                chatroomId={incomingCall?.chatroomId || selectedUser?.id}
                autoStart={incomingCall ? incomingCall.type : "audio"}
                incomingCall={incomingCall}
                setShowGroupCall={setShowGroupCall}
              />
            </div>
          </div>
        </div>
      )}

      {/*  Private Call Modal - works even if no user selected */}
      {showPrivateCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-transparent bg-opacity-30 dark:bg-black dark:bg-opacity-50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          ></div>

          <div className="relative w-full max-w-3xl h-[80vh] bg-white/80 dark:bg-slate-800/80 rounded-lg shadow-lg overflow-hidden backdrop-blur-md animate-fade-in">
            <button
              className="absolute cursor-pointer top-3 right-3 p-2 bg-gray-200/70 dark:bg-slate-700/70 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              onClick={() => {
                setShowPrivateCall(false);
                setPendingOffer(null); // Clear pending offer when closing
              }}
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="w-full h-full p-4 overflow-hidden">
              <PrivateCall
                userId={Number(loginUser.user.id)}
                receiver_id={Number(
                  incomingCall?.from ||
                  incomingCall?.receiver?.id ||
                  selectedUser?.id ||
                  incomingFromUser?.id
                )}
                incomingCall={incomingCall}
                pendingOffer={pendingOffer}
                setShowCall={setShowPrivateCall}
              />
            </div>
          </div>
        </div>
      )}
      {/* Chat layout */}
      <div className="flex-1 flex border-l  h-[calc(100vh-4rem)] ">
        <div className={`flex-1  border-r lg:block ${showInfo ? "hidden lg:block" : "block"}`}>
          {selectedUser ? (
            selectedUser.is_group ? (
              <GroupChat
                user={selectedUser}
                loginUser={loginUser}
                key={`group-${selectedUser.id}`}
              />
            ) : (
              <PrivateChat
                user={selectedUser}
                loginUser={loginUser}
                key={`private-${selectedUser?.id}`}
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400 ">
              Select a user to start chatting
            </div>
          )}
        </div>

        {showInfo && selectedUser && (
          <div className="h-[calc(100vh-4rem)]  dark:bg-slate-800 p-4 w-full lg:w-90 lg:border-l">
            <div className="flex items-center mb-4 lg:hidden">
              <Button variant="ghost" onClick={() => setShowInfo(false)} className="mr-2">
                <ArrowLeft />
              </Button>
            </div>
            <ChatInfoPanel selectedUser={selectedUser} />
          </div>
        )}
      </div>
    </>
  );
}
