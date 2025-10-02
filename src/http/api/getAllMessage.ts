import { AxiosError } from "axios";
import axiosInstance from "../httpClient";

interface GetAllMessageProps {
  receiverId: number;
  page: number;
  pageSize: number;
}
export const GetAllMessage = async ({receiverId, page, pageSize} : GetAllMessageProps) => {
    try{
        const response = await axiosInstance.get(`/message/get-all-messages?receiver_id=${receiverId}&page=${page}&pageSize=${pageSize}`);
        // console.log("response data in get all message", response.data);
        return response.data;
    }catch(error){
        if(error instanceof AxiosError) {
            throw (
                error.response?.data?.message ||
                "An error occurred while retrieving get all messages"
            );
        }
        throw new Error("An unexpected error occurred retrieving create room");
    }
}