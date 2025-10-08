import { useQuery } from "@tanstack/react-query";
import { getChatrooms } from "../../http/api/groupChat/getChatroom";

interface GroupChatProps {
    page: number
    pageSize: number
}
export const useGroupChatList = (data: GroupChatProps) => {
    const groupChatListQuery = useQuery({
        queryKey: ['groupChatList'],
        queryFn: async () => {
            const response = await getChatrooms(data);
            return response;
        }
    });
//console.log("data in mutation", groupChatListQuery.data)
    return {
        groupChatListQuery: groupChatListQuery.data,
        isLoading: groupChatListQuery.isLoading,
        isError: groupChatListQuery.isError,
        error: groupChatListQuery.error
    }
}