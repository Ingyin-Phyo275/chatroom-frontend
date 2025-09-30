import { AxiosError } from "axios";
import axiosInstance from "../httpClient";
import type { GroupChatResponse } from "../../dto/response/ChatRoom";

// export const getChatrooms = async () => {
//     try{
//         const response = await axiosInstance.get("/chatroom/get-all-chatrooms");
//         const returnData = response.data.data.map((chatroom: GroupChatResponse) => ({
//             id: chatroom.id,
//             name: chatroom.name,
//             is_group: chatroom.is_group
//         }))
//         return returnData;
//     }catch (error) {
//         if(error instanceof AxiosError) {
//             throw (
//                 error.response?.data?.message ||
//                 "An error occurred while create room"
//             );
//         }
//         throw new Error("An unexpected error occurred while create room");
//     }
// }

interface GroupChatProps {
    page: number;
    pageSize: number;
}

export const getChatrooms = async ({page, pageSize}: GroupChatProps) => {
    try{
        const response = await axiosInstance.get(`/chatroom/get-all-chatrooms?page=${page}&pageSize=${pageSize}`,);
        //console.log("response data", response.data);
        const returnData = response.data.data.data.map((chatroom: GroupChatResponse) => ({
            id: chatroom.id,
            name: chatroom.name,
            is_group: true
            
        }))
        //console.log("get chatrooms in api", returnData);
        return returnData;
    }catch (error) {
        if(error instanceof AxiosError) {
            throw (
                error.response?.data?.message ||
                "An error occurred while create room"
            );
        }
        throw new Error("An unexpected error occurred while create room");
    }
}