import { AxiosError } from "axios";
import axiosInstance from "../../httpClient";

export const deleteMessage = async (messageId: number, chatroom_id: number) => {
    try {
        const response = await axiosInstance.delete(`/chatroom/delete-message?chatroom_id=${chatroom_id}&messageId=${messageId}`);
        console.log("delete message response", response.data);
        return response.data;
    }catch (error){
        if (error instanceof AxiosError) {
            throw (
                error.response?.data?.message ||
                "An error occurred while deleting message"
            );
        }
        throw new Error("An unexpected error occurred while deleting message");
    }
}