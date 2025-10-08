import { AxiosError } from "axios";
import axiosInstance from "../../httpClient";
import type { addMembersData } from "../../../dto/input/addMember";

export const removeMembers = async ({ chatroomId, userIds }: addMembersData) => {
  try {
    const response = await axiosInstance.delete("/chatroom/remove-member", {
      data: { chatroomId, userIds }, // <-- pass as `data` in config
    });
    console.log("chatroom response data", response.data);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw (
        error.response?.data?.message ||
        "An error occurred while removing members"
      );
    }
    throw new Error("An unexpected error occurred while removing members");
  }
};
