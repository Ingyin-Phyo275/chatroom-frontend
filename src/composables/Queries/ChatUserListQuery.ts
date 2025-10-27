import { useQuery } from "@tanstack/react-query"
import type { UserListResponse } from "../../dto/response/UserListResponse"
import { getChatUserList } from "../../http/api/privateChat/getChatList";

export const chatUserListQuery = () => {
    const userListData = useQuery<UserListResponse[]>({
        queryKey: ['chatUserList'],
        queryFn: async () => {
            const response = await getChatUserList();
            return response;
        },
        refetchOnWindowFocus: true,
        refetchInterval: 3000
    });
//    console.log("Refetch data in every 3 seconds", userListData.data)
    return {
        userListData: userListData.data,
        isLoading: userListData.isLoading,
        isError: userListData.isError,
        error: userListData.error,
        isFetching: userListData.isFetching
    }

}