import type { UserRegister } from "@/dto/input/UserRegister";
import axiosInstance from "@/http/httpClient";
import { AxiosError } from "axios";

export const registerUser = async (data: UserRegister) => {
    try{
        const response = await axiosInstance.post("/auth/register", data);
        return response.data
    }catch(error){
        if (error instanceof AxiosError) {
      throw (
        error.response?.data?.message ||
        "An error occurred while account register"
      );
    }
    throw new Error("An unexpected error occurred while account register");
  }
 }
