import axios from "axios";
import axiosInstance from "../../httpClient";
import type { UserListResponse } from "../../../dto/response/UserListResponse";

export const getChatUserList = async () => {
    try {
        const response = await axiosInstance.get<{
            status: boolean;
            message: string;
            data: UserListResponse[];
        }>("/user/user-personal" );

        const returnData: UserListResponse[] = response.data.data.map((user) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar_url: user.avatar_url, 
            phone_no: user.phone_no,
            status: user.status,
            is_group: false,
            unreadCount: user?.unreadCount
        }));
    return returnData;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            throw (
                error.response?.data?.message ||
                "An error occurred while retrieving chat user list"
            );
        }
        throw new Error("An unexpected error occurred while retrieving chat user list");
    }
};
