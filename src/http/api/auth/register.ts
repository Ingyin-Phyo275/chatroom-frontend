import type { UserRegister } from "@/dto/input/UserRegister";
import axiosInstance from "@/http/httpClient";
import { AxiosError } from "axios";

export const register = async (data: UserRegister) => {
    try{
        const response = await axiosInstance.post("/auth/create-user", {userData: data});
        // console.log("response data", response.data);
        // console.log("response status", response.status);
        return response
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
