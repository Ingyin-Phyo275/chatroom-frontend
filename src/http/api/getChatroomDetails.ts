import { AxiosError } from "axios";
import axiosInstance from "../httpClient";
import type { ChatroomDetails } from "../../dto/response/ChatroomDetails";

export const getChatroomDetails = async (id: string) => {
    try {
        const response = await axiosInstance.get(`/chatroom/get-chatroom-details/${id}`);
        console.log("API response:", response.data);

        // If response.data is an array itself
        const chatrooms = Array.isArray(response.data.data) ? response.data.data : [response.data.data];

        const returnData = chatrooms.map((chatroom: ChatroomDetails) => ({
            id: chatroom.id,
            name: chatroom.name,
            is_group: chatroom.is_group,
            members: chatroom.members,
            message: chatroom.message
        }));

        return returnData;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw (
                error.response?.data?.message ||
                "An error occurred while retrieving chat room details"
            );
        }
        throw new Error("An unexpected error occurred while retrieving chat room details");
    }
}
