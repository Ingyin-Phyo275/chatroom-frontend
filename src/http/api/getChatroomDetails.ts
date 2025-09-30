import { AxiosError } from "axios";
import axiosInstance from "../httpClient";
import type { ChatroomDetails } from "../../dto/response/ChatroomDetails";

interface ChatroomDetailsProps {
  chatroomId: number;
  page: number;
  pageSize: number;
}
export const getChatroomDetails = async ({chatroomId, page, pageSize}: ChatroomDetailsProps) => {
  try {
    const response = await axiosInstance.get(`/chatroom/get-chatroom-details?chatroomId=${chatroomId}&page=${page}&pageSize=${pageSize}`);

    const chatroom: ChatroomDetails = response.data.data;
    // console.log("chatroom response members", chatroom.members);

    return {
      id: chatroom.id,
      name: chatroom.name,
      is_group: chatroom.is_group,
      members: chatroom.members,
      messages: chatroom.messages ?? [], // ensure messages is always an array
      totalPage: chatroom.totalPage
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      throw error.response?.data?.message || 
            "An error occurred while retrieving chat room details";
    }
    throw new Error("An unexpected error occurred while retrieving chat room details");
  }
};
