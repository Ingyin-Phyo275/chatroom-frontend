import { AxiosError } from "axios";
import axiosInstance from "../../httpClient";

export const getNonGroupMembers = async (chatId: string) => {
    try {
        const response = await axiosInstance.get(`/chatroom/get-non-group-members/${chatId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw error.response?.data?.message || "An error occurred while fetching members";
        }
        throw new Error("An unexpected error occurred while fetching members");
    }
};