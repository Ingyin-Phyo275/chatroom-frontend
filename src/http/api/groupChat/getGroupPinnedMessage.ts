import { AxiosError } from "axios"
import axiosInstance from "../../httpClient";

export const getGroupPinnedMessage = async (chatroom_id: string) => {
    try {
        const response = await axiosInstance.get(`/chatroom/get-chatroom-pinned-message?chatroom_id=${chatroom_id}`);
        console.log("pinned response", response.data);
        return response.data
    } catch (error) {
        if(error instanceof AxiosError) {
            throw error.response?.data?.message || "An error occurred while fetching pinned message";
        }
        throw new Error("An unexpected error occurred while fetching pinned message");
    }
}