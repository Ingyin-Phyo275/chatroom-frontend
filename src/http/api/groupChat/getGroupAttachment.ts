import axiosInstance from "@/http/httpClient";
import { AxiosError } from "axios";

export const getGroupAttachment = async (id: string) => {
  try {
    const response = await axiosInstance.get(`chatroom/get-chatroom-media?chatroom_id=${id}`);
    const data = response?.data;

    console.log("group chat", data)
    // Extract attachment URLs from messages
    const attachments: string[] = data.messages
      .filter((msg: any) => msg.attachment_url && msg.attachment_url.length > 0)
      .flatMap((msg: any) => msg.attachment_url);

    //console.log("All attachments:", attachments);
    return attachments;

  } catch (error) {
    if (error instanceof AxiosError) {
      throw error.response?.data?.message || "An error occurred while fetching attachment";
    }
    throw new Error("An unexpected error occurred while fetching attachment");
  }
}
