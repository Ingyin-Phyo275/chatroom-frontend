import { AxiosError } from "axios";
import axiosInstance from "../../httpClient";

export const GetPrivateMessage = async () => {
    try{
        const response = await axiosInstance.get("/message/get-all-message");
        console.log("response data in get private message", response.data);
        return response.data;
    }catch(error){
        if(error instanceof AxiosError) {
            throw (
                error.response?.data?.message ||
                "An error occurred while retrieving get private messages"
            );
        }
        throw new Error("An unexpected error occurred retrieving private message");
    }
}