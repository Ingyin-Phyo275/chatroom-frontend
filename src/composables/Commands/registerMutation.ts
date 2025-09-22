import type { UserRegister } from "@/dto/input/UserRegister";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { register } from "../../http/api/auth/register";

export const useRegisterUser = () => {
  const registerMutation = useMutation({
    mutationFn: async (data: UserRegister) => {
      try {
        const response = await register(data);

        // Success
        if (response.status === 200 && response.data.status) {
          toast.success(response.data.message);
        }
        return response.data;
      } catch (error: any) {
        throw error; 
      }
    },
  });

  return {
    registerMutation: registerMutation.mutateAsync,
  };
};
