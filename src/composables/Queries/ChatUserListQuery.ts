import { useQuery } from "@tanstack/react-query"
import type { UserListResponse } from "../../dto/response/UserListResponse"
import { getChatUserList } from "../../http/api/getChatList";

export const chatUserListQuery = () => {
    const userListData = useQuery<UserListResponse[]>({
        queryKey: ['chatUserList'],
        queryFn: async () => {
            const response = await getChatUserList();
            return response;
        }
    });
    // console.log("response data in mutation", userListData.data)
    return {
        userListData: userListData.data,
        isLoading: userListData.isLoading,
        isError: userListData.isError,
        error: userListData.error
    }
}