import { useMutation } from "@tanstack/react-query"
import type { UserLogin } from "../../dto/input/UserLogin"
import { login } from "../../http/api/auth/login"
import { toast } from "sonner"

export const useLogin = () => {
    const loginMutation = useMutation({
        mutationFn: async (data: UserLogin) => {
            const response = await login(data);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Login successful");
        }
    })

    return {
        loginMutation: loginMutation.mutateAsync
    }
}