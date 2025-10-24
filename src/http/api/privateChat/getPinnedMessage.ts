import { AxiosError } from "axios"
import axiosInstance from "../../httpClient";

export const getPinnedMessage = async (receiver_id: string) => {
    try {
        const response = await axiosInstance.get(`/message/get-pinned-message?receiver_id=${receiver_id}`);
        console.log("pinned response", response.data);
        return response.data
    } catch (error) {
        if(error instanceof AxiosError) {
            throw error.response?.data?.message || "An error occurred while fetching pinned message";
        }
        throw new Error("An unexpected error occurred while fetching pinned message");
    }
}