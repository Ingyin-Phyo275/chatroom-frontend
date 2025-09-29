import { useQuery } from "@tanstack/react-query"
import { deleteChat } from "../../http/api/deleteChat";
import type { DeleteChatProps } from "../../dto/input/deleteChatProps";

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