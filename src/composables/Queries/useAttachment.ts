import { getPrivateChatAttachment } from "@/http/api/privateChat/getAttachment";
import { useQuery } from "@tanstack/react-query";

export const useAttachment = (id: string) => {
  const response = useQuery({
    queryKey: ['attachment', id],
    queryFn: async () => {
      const attachments = await getPrivateChatAttachment(id);
      return attachments; // already the array
    },
    enabled: !!id
  });

  return {
    attachments: response.data,
    attachment_error: response.error,
    isLoading: response.isLoading,
  };
};
