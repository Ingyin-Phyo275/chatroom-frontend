import { AxiosError } from "axios";
import axiosInstance from "../httpClient";


export const ChatroomUploadFile = async (file: File | Blob | string, chatroom_id: string, content: string) => {
    try{
        const formData = new FormData();
        formData.append("attachment_url", file);
        formData.append("chatroom_id", chatroom_id.toString());
        formData.append("content", content ?? "");
        const response = await axiosInstance.post("/chatroom/sent-file", formData, {headers: {"Content-Type": "multipart/form-data",}});
        console.log("response data", response.data);
        return response.data;
    }catch (error){
        if(error instanceof AxiosError) {
            throw (
                error.response?.data?.message ||
                "An error occurred while uploading file"
            );
        }
        throw new Error("An unexpected error occurred while uploading file");
    }
}