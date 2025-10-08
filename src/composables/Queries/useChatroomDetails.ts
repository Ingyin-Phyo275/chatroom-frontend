import { useQuery } from "@tanstack/react-query";
import { getChatroomDetails } from "../../http/api/groupChat/getChatroomDetails";


interface chatroomDetailsProps {
  chatroomId: number;
  page: number;
  pageSize: number;
}
// useChatroomDetails.ts
export const useChatroomDetails = ({chatroomId, page, pageSize}: chatroomDetailsProps) =>
  useQuery({
    queryKey: ['chatroomDetails', String(chatroomId)], // force string
    queryFn: async () => {
      const response = await getChatroomDetails({chatroomId, page, pageSize});
      return response;
    },
    enabled: !!chatroomId
  });
