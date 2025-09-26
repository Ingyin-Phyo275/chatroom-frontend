import { AxiosError } from "axios";
import axiosInstance from "../httpClient";
import type { ChatroomDetails } from "../../dto/response/ChatroomDetails";

export const getChatroomDetails = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/chatroom/get-chatroom-details/${id}`);

    const chatroom: ChatroomDetails = response.data.data;
    console.log("chatroom response members", chatroom.members);
    console.log("chatroom response message", chatroom.messages);

    return {
      id: chatroom.id,
      name: chatroom.name,
      is_group: chatroom.is_group,
      members: chatroom.members,
      messages: chatroom.messages ?? [], // ensure messages is always an array
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      throw error.response?.data?.message || 
            "An error occurred while retrieving chat room details";
    }
    throw new Error("An unexpected error occurred while retrieving chat room details");
  }
};
