import type { UserRegister } from "@/dto/input/UserRegister";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { register } from "../../http/api/auth/register";

export const registerUser = () => {
    const registerMutation = useMutation({
        mutationFn: async (data: UserRegister) => {
            const response = await register(data);
            return response.data;
        },
        onSuccess: () => {
            toast.success("User registered successfully");
        }
    });

    return {
        registerMutation: registerMutation.mutateAsync
    }
}