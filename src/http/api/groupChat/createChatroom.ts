import { AxiosError } from "axios";
import axiosInstance from "../../httpClient";
import type { CreateChatRoom } from "../../../dto/input/createChatroom";

export const createChatroom = async (data: CreateChatRoom) => {
    try{
        const response = await axiosInstance.post("/chatroom/create-chat-room", data);
        console.log("chatroom response data", response.data);
        return response.data;
    }catch(error){
        if(error instanceof AxiosError) {
            throw (
                error.response?.data?.message ||
                "An error occurred while create room"
            );
        }
        throw new Error("An unexpected error occurred while create room");
    }
}