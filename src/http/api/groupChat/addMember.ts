import { AxiosError } from "axios";
import axiosInstance from "../../httpClient";
import type { addMembersData } from "../../../dto/input/addMember";

export const addMembers = async ({chatroomId, userIds}: addMembersData) => {
    try {
        const response = await axiosInstance.post("/chatroom/add-member", { chatroomId, userIds });
        console.log("chatroom response data", response.data);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw (
                error.response?.data?.message ||
                "An error occurred while create room"
            );
        }
        throw new Error("An unexpected error occurred while create room");
    }
}   