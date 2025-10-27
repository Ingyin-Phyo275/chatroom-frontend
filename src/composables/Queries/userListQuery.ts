import { useQuery } from "@tanstack/react-query"
import type { UserListResponse } from "../../dto/response/UserListResponse"
import { userList } from "../../http/api/privateChat/userList";

export const userListQuery = () => {
    const userListData = useQuery<UserListResponse[]>({
        queryKey: ['userList'],
        queryFn: async () => {
            const response = await userList();
            return response;
        },
                refetchOnWindowFocus: true,
        refetchInterval: 3000
    });
    return {
        userListData: userListData.data,
        isLoading: userListData.isLoading,
        isError: userListData.isError,
        error: userListData.error
    }
}