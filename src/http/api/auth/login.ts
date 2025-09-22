import { AxiosError } from "axios";
import type { UserLogin } from "../../../dto/input/UserLogin";
import axiosInstance from "../../httpClient";

export const login = async (data: UserLogin) => {
    try {
        const response = await axiosInstance.post("/auth/login", data);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw (
                error.response?.data?.message ||
                "An error occurred while account register"
            );
        }
        throw new Error("An unexpected error occurred while account register");
    }
}