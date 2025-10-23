import { getGroupAttachment } from "@/http/api/groupChat/getGroupAttachment";
import { useQuery } from "@tanstack/react-query";

export const useGroupAttachment = (id: string) => {
  const response = useQuery({
    queryKey: ['attachment', id],
    queryFn: async () => {
      const attachments = await getGroupAttachment(id);
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
