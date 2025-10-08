import { AxiosError } from "axios";
import axiosInstance from "../../httpClient";

export const deleteMessage = async (messageId: number, receiver_id: number) => {
    try {
        const response = await axiosInstance.delete(`/message/delete-message?receiver_id=${receiver_id}&messageId=${messageId}`);
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