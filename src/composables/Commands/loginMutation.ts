import { useMutation } from "@tanstack/react-query"
import type { UserLogin } from "../../dto/input/UserLogin"
import { login } from "../../http/api/auth/login"
import { toast } from "sonner"

export const useLogin = () => {
    const loginMutation = useMutation({
        mutationFn: async (data: UserLogin) => {
            const response = await login(data);
            if(response.status === 200 && response.data.status === 200) {
                toast.success(response.data.message || "Login successful");
            }
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