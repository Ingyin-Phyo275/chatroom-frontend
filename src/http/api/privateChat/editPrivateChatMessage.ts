import { AxiosError } from "axios"
import axiosInstance from "../../httpClient";

interface editPrivateChatMessageProps {
    msgId: number,
    content: string,
}

export const editPrivateChatMessage = async (data: editPrivateChatMessageProps) => {
    try{
        const response = await axiosInstance.put(`/message/edit-message`,data);
        return response.data;
    }catch (error){
        if(error instanceof AxiosError){
            throw new Error(error.response?.data?.message || "Failed to edit message");
        }
    }
}