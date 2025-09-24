import { useQuery } from "@tanstack/react-query";
import { getChatrooms } from "../../http/api/getChatroom";

export const useGroupChatList = () => {
    const groupChatListQuery = useQuery({
        queryKey: ['groupChatList'],
        queryFn: async () => {
            const response = await getChatrooms();
            return response;
        }
    });

    return {
        groupChatListQuery: groupChatListQuery.data,
        isLoading: groupChatListQuery.isLoading,
        isError: groupChatListQuery.isError,
        error: groupChatListQuery.error
    }
}