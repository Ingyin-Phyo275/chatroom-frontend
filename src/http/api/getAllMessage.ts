import { AxiosError } from "axios";
import axiosInstance from "../httpClient";

export const GetAllMessage = async () => {
    try{
        const response = await axiosInstance.get("/message/get-all-message");
        console.log("response data in get all message", response.data);
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