import type { UserRegister } from "@/dto/input/UserRegister";
import axiosInstance from "@/http/httpClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const registerUser = () => {
    const registerMutation = useMutation({
        mutationFn: async (data: UserRegister) => {
            const response = await axiosInstance.post("/auth/register", data);
            return response.data
        },
        onSuccess: () => {
            toast.success("User registered successfully");
        }
    });

    return {
        registerMutation: registerMutation.mutateAsync
    }
}