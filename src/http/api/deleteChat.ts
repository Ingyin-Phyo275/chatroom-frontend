import { AxiosError } from "axios";
import axiosInstance from "../httpClient";
import type { DeleteChatProps } from "../../dto/input/deleteChatProps";

export const deleteChat = async (data: DeleteChatProps) => {
    try {
        const response = await axiosInstance.delete(`/chatroom/delete-chat`, {
            data: {
                chatId : data.chatId,
                userId : data.userId
            }
        });
        console.log("Delete chat response", response.data);
    } catch (error) {
        if (error instanceof AxiosError) {
            throw error.response?.data?.message || "An error occurred while deleting chat";
        }
        throw new Error("An unexpected error occurred while deleting chat");
    }
}