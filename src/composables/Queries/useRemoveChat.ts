import { useQuery } from "@tanstack/react-query"
import type { DeleteChatProps } from "../../dto/input/deleteChatProps";
import { deleteChat } from "../../http/api/groupChat/deleteChat";

export const useRemoveChat = (data: DeleteChatProps) => {
    const removeChatData = useQuery({
        queryKey: ['removeChat', data],
        queryFn: async () => {
            const response = await deleteChat(data);
            return response;
        }
    })
    return removeChatData.data;
}