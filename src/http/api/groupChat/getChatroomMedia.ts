import { AxiosError } from "axios";
import axiosInstance from "../../httpClient";

export const getChatroomMedia = async (chatroomId: number) => {
    try{
        const response = await axiosInstance.post(`/chatroom/get-media/${chatroomId}`);
        return response.data.data;
    }catch(error){
        if(error instanceof AxiosError) {
            throw error.response?.data?.message || "An error occurred while fetching media";
        }
        throw new Error("An unexpected error occurred while fetching media");
    }
}