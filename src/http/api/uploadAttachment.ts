import { AxiosError } from "axios";
import axiosInstance from "../httpClient";

export const uploadAttachment = async (file: File | Blob | string, type: string) => {
    try {
        const formData = new FormData();
        formData.append("attachment_url", file);
        formData.append("type", type);
                console.log("form data payload", {formData, type});
        const response = await axiosInstance.post("/message/send-attachment", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    }catch (error){
        if (error instanceof AxiosError) {
            throw (
                error.response?.data?.message ||
                "An error occurred while uploading attachment"
            );
        }
        throw new Error("An unexpected error occurred while uploading attachment");
    }
}