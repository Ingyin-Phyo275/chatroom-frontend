import { useQuery } from "@tanstack/react-query";
import { getChatroomDetails } from "../../http/api/getChatroomDetails";

// export const useChatroomDetails = (id: string) => {
//     const chatroomDetailsQuery = useQuery({
//         queryKey: ['chatroomDetails', id],
//         queryFn: async () => {
//             const response = await getChatroomDetails(id);
//             return response;
//         }
//     });
//     return  {
//         chatroomMembers: chatroomDetailsQuery?.data?.members,
//         messages: chatroomDetailsQuery?.data?.messages,
//         isLoading: chatroomDetailsQuery.isLoading,
//         isError: chatroomDetailsQuery.isError,
//         error: chatroomDetailsQuery.error
//     }
// }

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
