import { AxiosError } from "axios";
import axiosInstance from "../httpClient";

interface editGroupChatMessageProps {
    chatroomId: number,
    messageId: number,
    message: string
}
export const editGroupChatMessage = async (data: editGroupChatMessageProps) => {
    try{
        const response = await axiosInstance.put(`chatroom/edit-chatroom-message`,data);
        return response.data;
    }catch(error){
        if(error instanceof AxiosError) {
            throw (
                error.response?.data?.message ||
                "An error occurred while editing chat message"
            );
        }
        throw new Error("An unexpected error occurred editing chat message");
    }
}